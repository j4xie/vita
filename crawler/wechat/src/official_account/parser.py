"""
ArticleParser - 微信公众号文章HTML解析器
从 mp.weixin.qq.com 文章页面提取结构化数据
"""
import re
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from bs4 import BeautifulSoup


@dataclass
class ArticleData:
    title: str = ''
    author: str = ''
    account_name: str = ''
    account_biz: str = ''
    publish_date: str = ''
    content_html: str = ''
    content_text: str = ''
    summary: str = ''
    cover_image_url: str = ''
    source_url: str = ''
    reading_count: int = 0
    like_count: int = 0
    images: List[str] = field(default_factory=list)
    videos: List[str] = field(default_factory=list)
    audios: List[str] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


class ArticleParser:
    """解析微信公众号文章HTML"""

    def parse(self, html: str, source_url: str = '') -> ArticleData:
        soup = BeautifulSoup(html, 'lxml')
        article = ArticleData(source_url=source_url)

        # 标题
        article.title = self._extract_title(soup, html)
        # 作者
        article.author = self._extract_author(soup, html)
        # 公众号名称
        article.account_name = self._extract_account_name(soup, html)
        # __biz
        article.account_biz = self._extract_biz(source_url, html)
        # 发布日期
        article.publish_date = self._extract_publish_date(soup, html)
        # 正文
        article.content_html, article.content_text = self._extract_content(soup)
        # 摘要
        article.summary = article.content_text[:200] if article.content_text else ''
        # 封面图
        article.cover_image_url = self._extract_cover_image(soup, html)
        # 图片列表
        article.images = self._extract_images(soup)
        # 视频列表
        article.videos = self._extract_videos(soup, html)
        # 音频列表
        article.audios = self._extract_audios(soup, html)

        return article

    def _extract_title(self, soup: BeautifulSoup, html: str) -> str:
        # 方法1: og:title meta
        og = soup.find('meta', property='og:title')
        if og and og.get('content'):
            return og['content'].strip()
        # 方法2: #activity-name
        el = soup.find(id='activity-name')
        if el:
            return el.get_text(strip=True)
        # 方法3: JS变量
        m = re.search(r'var\s+msg_title\s*=\s*["\'](.+?)["\']', html)
        if m:
            return m.group(1).strip()
        # 方法4: <title>
        if soup.title:
            return soup.title.get_text(strip=True)
        return ''

    def _extract_author(self, soup: BeautifulSoup, html: str) -> str:
        el = soup.find(id='js_name') or soup.find(class_='rich_media_meta_text')
        if el:
            return el.get_text(strip=True)
        m = re.search(r'var\s+msg_source_url\s*=\s*["\'](.+?)["\']', html)
        return ''

    def _extract_account_name(self, soup: BeautifulSoup, html: str) -> str:
        # JS变量
        m = re.search(r'var\s+nickname\s*=\s*["\'](.+?)["\']', html)
        if m:
            return m.group(1).strip()
        # og:article:author
        og = soup.find('meta', property='og:article:author')
        if og and og.get('content'):
            return og['content'].strip()
        # profile_nickname
        el = soup.find(id='js_name') or soup.find(class_='profile_nickname')
        if el:
            return el.get_text(strip=True)
        return ''

    def _extract_biz(self, url: str, html: str) -> str:
        m = re.search(r'__biz=([A-Za-z0-9+/=]+)', url)
        if m:
            return m.group(1)
        m = re.search(r'var\s+__biz\s*=\s*["\']([A-Za-z0-9+/=]+)["\']', html)
        if m:
            return m.group(1)
        return ''

    def _extract_publish_date(self, soup: BeautifulSoup, html: str) -> str:
        # JS变量 publish_time
        m = re.search(r'var\s+publish_time\s*=\s*["\'](\d{4}-\d{2}-\d{2})["\']', html)
        if m:
            return m.group(1)
        # createTime 时间戳
        m = re.search(r'var\s+createTime\s*=\s*["\'](\d+)["\']', html)
        if m:
            from datetime import datetime
            ts = int(m.group(1))
            return datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
        # og:article:published_time
        og = soup.find('meta', property='og:article:published_time')
        if og and og.get('content'):
            return og['content'][:10]
        # #publish_time 元素
        el = soup.find(id='publish_time')
        if el:
            return el.get_text(strip=True)[:10]
        return ''

    def _extract_content(self, soup: BeautifulSoup):
        content_el = soup.find(id='js_content')
        if not content_el:
            content_el = soup.find(class_='rich_media_content')
        if content_el:
            html = str(content_el)
            text = content_el.get_text(separator='\n', strip=True)
            return html, text
        return '', ''

    def _extract_cover_image(self, soup: BeautifulSoup, html: str) -> str:
        og = soup.find('meta', property='og:image')
        if og and og.get('content'):
            return og['content']
        m = re.search(r'var\s+msg_cdn_url\s*=\s*["\'](.+?)["\']', html)
        if m:
            return m.group(1)
        return ''

    def _extract_images(self, soup: BeautifulSoup) -> List[str]:
        images = []
        content_el = soup.find(id='js_content') or soup.find(class_='rich_media_content')
        if not content_el:
            return images
        for img in content_el.find_all('img'):
            src = img.get('data-src') or img.get('src') or ''
            if src and 'mmbiz.qpic.cn' in src:
                images.append(src)
        return images

    def _extract_videos(self, soup: BeautifulSoup, html: str) -> List[str]:
        videos = []
        for iframe in soup.find_all('iframe', class_='video_iframe'):
            src = iframe.get('data-src') or iframe.get('src') or ''
            if src:
                videos.append(src)
        # mpvideo
        for m in re.finditer(r'data-mpvid="([^"]+)"', html):
            videos.append(f'https://mp.weixin.qq.com/mp/readtemplate?t=pages/video_player_tmpl&vid={m.group(1)}')
        return videos

    def _extract_audios(self, soup: BeautifulSoup, html: str) -> List[str]:
        audios = []
        for m in re.finditer(r'voice_encode_fileid="([^"]+)"', html):
            audios.append(f'https://res.wx.qq.com/voice/getvoice?mediaid={m.group(1)}')
        for el in soup.find_all('mpvoice'):
            fid = el.get('voice_encode_fileid', '')
            if fid:
                audios.append(f'https://res.wx.qq.com/voice/getvoice?mediaid={fid}')
        return audios
