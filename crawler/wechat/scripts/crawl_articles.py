#!/usr/bin/env python3
"""
WeChat 公众号文章爬取 CLI
方式A: 直接URL爬取

用法:
  # 单篇文章 -> JSON
  python scripts/crawl_articles.py --urls "https://mp.weixin.qq.com/s/xxx"

  # 多篇文章 -> JSON + DOCX
  python scripts/crawl_articles.py --urls "url1" "url2" --format docx

  # 指定输出目录
  python scripts/crawl_articles.py --urls "url" --output-dir ./output/articles

  # 同时下载图片
  python scripts/crawl_articles.py --urls "url" --download-media --format docx
"""
import argparse
import asyncio
import json
import logging
import os
import sys

# 确保能导入 src 模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.official_account.crawler import ArticleCrawler
from src.official_account.exporter import export_json, export_docx, export_batch_index


def setup_logging(level: str = 'INFO'):
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%H:%M:%S',
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description='WeChat Article Crawler - Method A (Direct URL)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        '--urls', nargs='+', required=True,
        help='One or more WeChat article URLs (mp.weixin.qq.com)',
    )
    parser.add_argument(
        '--output-dir', default='./output/articles',
        help='Output directory (default: ./output/articles)',
    )
    parser.add_argument(
        '--format', choices=['json', 'docx', 'both'], default='both',
        help='Export format (default: both)',
    )
    parser.add_argument(
        '--download-media', action='store_true',
        help='Download article images to local',
    )
    parser.add_argument(
        '--proxy', default=None,
        help='HTTP proxy (e.g., http://127.0.0.1:7890)',
    )
    parser.add_argument(
        '--concurrency', type=int, default=3,
        help='Max concurrent requests (default: 3)',
    )
    parser.add_argument(
        '--log-level', default='INFO',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        help='Log level (default: INFO)',
    )
    return parser.parse_args()


async def main():
    args = parse_args()
    setup_logging(args.log_level)
    logger = logging.getLogger(__name__)

    output_dir = os.path.abspath(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    media_dir = os.path.join(output_dir, 'media')

    logger.info(f'Starting crawl: {len(args.urls)} URL(s)')
    logger.info(f'Output: {output_dir}')
    logger.info(f'Format: {args.format}')

    crawler = ArticleCrawler(
        download_media=args.download_media,
        media_dir=media_dir,
        proxy=args.proxy,
    )

    try:
        if len(args.urls) == 1:
            article = await crawler.crawl_article(args.urls[0])
            articles = [article] if article else []
        else:
            articles = await crawler.crawl_multiple(
                args.urls, concurrency=args.concurrency
            )

        if not articles:
            logger.error('No articles crawled successfully')
            return

        # 导出
        exported = []
        for article in articles:
            if args.format in ('json', 'both'):
                path = export_json(article, output_dir)
                exported.append(path)
            if args.format in ('docx', 'both'):
                path = export_docx(article, output_dir)
                exported.append(path)

        # 多篇时生成索引
        if len(articles) > 1:
            export_batch_index(articles, output_dir)

        # 打印结果摘要
        print('\n' + '=' * 60)
        print(f'  Crawl Complete: {len(articles)}/{len(args.urls)} articles')
        print('=' * 60)
        for a in articles:
            content_len = len(a.content_text)
            img_count = len(a.images)
            print(f'  [{a.publish_date or "N/A"}] {a.title}')
            print(f'    Account: {a.account_name or "N/A"}')
            print(f'    Content: {content_len} chars | Images: {img_count}')
        print('=' * 60)
        print(f'  Output dir: {output_dir}')
        for p in exported:
            print(f'    -> {os.path.basename(p)}')
        print('=' * 60)

    finally:
        await crawler.close()


if __name__ == '__main__':
    asyncio.run(main())
