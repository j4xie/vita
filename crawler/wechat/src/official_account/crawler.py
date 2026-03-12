"""
ArticleCrawler - 微信公众号文章爬虫
方式A: 直接URL爬取 (成功率~90%)
"""
import asyncio
import httpx
import logging
import os
import re
from typing import List, Optional

from .parser import ArticleParser, ArticleData

logger = logging.getLogger(__name__)

# 模拟微信内置浏览器的 User-Agent
WECHAT_UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 '
    'MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI '
    'MiniProg/e Chrome/122.0.6261.95'
)

BROWSER_UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
)

HEADERS = {
    'User-Agent': WECHAT_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Referer': 'https://mp.weixin.qq.com/',
}


class ArticleCrawler:
    """直接URL爬取微信公众号文章"""

    def __init__(
        self,
        download_media: bool = False,
        media_dir: str = './media',
        proxy: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.parser = ArticleParser()
        self.download_media = download_media
        self.media_dir = media_dir
        self.proxy = proxy
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=HEADERS,
                timeout=httpx.Timeout(self.timeout),
                follow_redirects=True,
                proxy=self.proxy,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def crawl_article(self, url: str) -> Optional[ArticleData]:
        """爬取单篇文章"""
        url = self._normalize_url(url)
        logger.info(f'[Crawl] {url}')

        client = await self._get_client()

        try:
            # 第一次尝试: httpx 直接请求
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text

            # 检测公众号迁移页面
            if self._is_migrated(html):
                new_url = self._extract_migrated_url(html)
                if new_url:
                    logger.info(f'[Crawl] Account migrated, new URL: {new_url}')
                    resp = await client.get(new_url)
                    resp.raise_for_status()
                    html = resp.text
                else:
                    logger.warning(f'[Crawl] Account migrated but cannot extract new URL: {url}')

            article = self.parser.parse(html, source_url=url)

            # 如果内容为空或被拦截，回退到 Playwright 浏览器渲染
            if not article.content_text or self._is_blocked(html):
                logger.info('[Crawl] Content empty or blocked, falling back to Playwright browser...')
                html = await self._fetch_with_playwright(url)
                if html:
                    article = self.parser.parse(html, source_url=url)

            if not article.content_text:
                logger.warning(f'[Crawl] Empty content for: {url}')

            # 下载媒体文件
            if self.download_media and article.images:
                await self._download_images(article)

            return article

        except httpx.HTTPStatusError as e:
            logger.error(f'[Crawl] HTTP {e.response.status_code}: {url}')
            return None
        except Exception as e:
            logger.error(f'[Crawl] Error: {e}')
            return None

    async def _fetch_with_playwright(self, url: str) -> Optional[str]:
        """使用 Playwright 浏览器渲染获取页面内容"""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.error('[Playwright] Not installed. Run: pip install playwright && playwright install chromium')
            return None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=BROWSER_UA,
                    locale='zh-CN',
                )
                page = await context.new_page()

                # 访问页面，等待内容加载
                await page.goto(url, wait_until='networkidle', timeout=30000)

                # 等待文章正文容器出现
                try:
                    await page.wait_for_selector('#js_content', timeout=10000)
                except Exception:
                    logger.warning('[Playwright] #js_content not found, trying to scroll...')
                    # 滚动页面触发懒加载
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                    await page.wait_for_timeout(2000)

                html = await page.content()
                await browser.close()

                logger.info(f'[Playwright] Page rendered, HTML length: {len(html)}')
                return html

        except Exception as e:
            logger.error(f'[Playwright] Error: {e}')
            return None

    async def crawl_multiple(
        self, urls: List[str], concurrency: int = 3
    ) -> List[ArticleData]:
        """批量爬取多篇文章"""
        sem = asyncio.Semaphore(concurrency)
        results = []

        async def _crawl_one(u: str):
            async with sem:
                article = await self.crawl_article(u)
                if article:
                    results.append(article)
                # 间隔避免被封
                await asyncio.sleep(1.5)

        tasks = [_crawl_one(u) for u in urls]
        await asyncio.gather(*tasks)
        return results

    def _normalize_url(self, url: str) -> str:
        """标准化URL"""
        url = url.strip()
        if not url.startswith('http'):
            url = 'https://' + url
        # 确保使用 https
        url = url.replace('http://', 'https://')
        return url

    def _is_blocked(self, html: str) -> bool:
        """检测是否被拦截"""
        blocked_signs = [
            'environment_hint',  # 环境检测页
            'verify_container',  # 验证码容器
            'captcha',
            'weixin110',  # 举报/投诉页
        ]
        html_lower = html.lower()
        for sign in blocked_signs:
            if sign in html_lower and 'js_content' not in html_lower:
                return True
        return False

    def _is_migrated(self, html: str) -> bool:
        """检测是否为公众号迁移页面"""
        return '账号已迁移' in html or '该公众号已迁移' in html

    def _extract_migrated_url(self, html: str) -> Optional[str]:
        """从迁移页面提取新文章URL"""
        # 方法1: 从HTML中找包含 __biz 的真实URL (非JS模板)
        matches = re.findall(
            r'https?://mp\.weixin\.qq\.com/s\?__biz=[A-Za-z0-9+/=]+&amp;mid=\d+&amp;idx=\d+&amp;sn=[a-f0-9]+',
            html
        )
        if matches:
            return matches[0].replace('&amp;', '&')

        # 方法2: 找不带 &amp; 的版本
        matches = re.findall(
            r'https?://mp\.weixin\.qq\.com/s\?__biz=[A-Za-z0-9+/=]+&mid=\d+&idx=\d+&sn=[a-f0-9]+',
            html
        )
        if matches:
            return matches[0]

        return None

    async def _download_images(self, article: ArticleData):
        """下载文章图片到本地"""
        client = await self._get_client()
        safe_title = re.sub(r'[<>:"/\\|?*]', '_', article.title)[:50]
        img_dir = os.path.join(self.media_dir, safe_title)
        os.makedirs(img_dir, exist_ok=True)

        for i, img_url in enumerate(article.images):
            try:
                resp = await client.get(img_url)
                resp.raise_for_status()
                ext = '.jpg'
                ct = resp.headers.get('content-type', '')
                if 'png' in ct:
                    ext = '.png'
                elif 'gif' in ct:
                    ext = '.gif'
                elif 'webp' in ct:
                    ext = '.webp'
                filepath = os.path.join(img_dir, f'img_{i:03d}{ext}')
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                logger.debug(f'[Download] Image saved: {filepath}')
            except Exception as e:
                logger.warning(f'[Download] Failed to download image {i}: {e}')
