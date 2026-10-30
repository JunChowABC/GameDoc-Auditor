"""Visual and functional regression test for the restored V0.9 static UI.
Use static DOM injection because this testing environment blocks navigation to localhost.
Run: python tests/test_v09_browser.py
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent / 'dist'
SCREENSHOT_PATH = Path(__file__).resolve().parent.parent.parent / 'GameDoc-Auditor-V09-Preview.png'

html = (ROOT / 'index.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
styles, scripts = [], []
for tag in soup.find_all('link'):
    if tag.get('rel') == ['stylesheet'] and tag.get('href'):
        styles.append(tag['href'].removeprefix('./'))
        tag.decompose()
for tag in soup.find_all('script'):
    if tag.get('src'):
        scripts.append(tag['src'].removeprefix('./'))
        tag.decompose()

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1660, 'height': 1040}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(str(soup), wait_until='domcontentloaded')
    for file in styles:
        page.add_style_tag(content=(ROOT / file).read_text(encoding='utf-8'))
    for file in scripts:
        page.add_script_tag(content=(ROOT / file).read_text(encoding='utf-8'))

    # V0.8 bridge + V0.9 controls have both initialized.
    assert page.locator('#graphFocusMode').count() == 1
    assert page.locator('#docSearch').count() == 1
    assert page.locator('#markdownTab').count() == 1

    sample = """# 海风补给站系统

## 参数设定

| 名称 | 初始值 | 上限 | 用途 |
| :--- | ---: | ---: | :--- |
| 金币 | 100 | 999999 | 建筑升级 |
| 体力 | 20 | 30 | 关卡挑战 |
| 补给券 | 5 | 99 | 兑换补给箱 |

## 游戏操作

- [x] 完成补给流程
- [ ] 测试资源扣除

> **注意**：请检查说明。

<script>window.__bad = 'run'</script>
"""
    # Upload 14 markdown files to exercise the fixed-height overflow and left list.
    files = [{'name': f'测试文档_{i:02d}.md', 'mimeType': 'text/markdown', 'buffer': sample.replace('金币 | 100', f'金币 | {100+i}').encode('utf-8')} for i in range(1, 15)]
    page.locator('#fileInput').set_input_files(files)
    page.wait_for_function("document.querySelectorAll('.upload-feedback-item').length === 14 && document.querySelector('.upload-feedback-title strong')?.textContent.includes('本次导入结果')",timeout=25000)
    page.wait_for_function("document.querySelectorAll('#docTabs .doc-chip').length === 14")
    feedback = page.locator('.upload-feedback-list')
    info = feedback.evaluate('(e)=>({height:e.clientHeight,scroll:e.scrollHeight,rows:getComputedStyle(e).gridTemplateRows,columns:getComputedStyle(e).gridTemplateColumns,overflowY:getComputedStyle(e).overflowY})')
    assert info['scroll'] > info['height'], info
    assert info['overflowY'] == 'auto', info
    assert len(info['rows'].split()) == 14//2, info
    assert page.locator('#markdownPane').is_visible()
    assert page.locator('#markdownContent table').count() == 1
    assert page.locator('#markdownContent tbody tr').count() == 3
    assert page.locator('#markdownContent th').count() == 4
    assert page.evaluate('window.__bad') is None
    page.screenshot(path=str(SCREENSHOT_PATH), full_page=True)

    # Vertical left nav + scroll + search + selection.
    navinfo = page.locator('.doc-navigator .doc-tabs').evaluate('(e)=>({dir:getComputedStyle(e).flexDirection,overflowY:getComputedStyle(e).overflowY})')
    assert navinfo == {'dir':'column','overflowY':'auto'}, navinfo
    page.locator('#docSearch').fill('测试文档_07')
    assert page.locator('.doc-chip:visible').count() == 1
    page.locator('.doc-chip:visible').click()
    assert page.locator('#docName').input_value() == '测试文档_07.md'
    assert '金币' in page.locator('#markdownContent').inner_text()
    page.locator('#docSearch').fill('')

    # Preview/source edit tabs, and then read Markdown again.
    page.locator('[data-editor-tab="edit"]').click()
    assert page.locator('#editPane').is_visible()
    assert not page.locator('#markdownPane').is_visible()
    page.locator('#docInput').fill(sample.replace('补给券', '试运行券'))
    page.locator('#markdownTab').click()
    assert '试运行券' in page.locator('#markdownContent').inner_text()
    page.locator('[data-editor-tab="preview"]').click()
    assert page.locator('#previewPane').is_visible()
    assert not page.locator('#markdownPane').is_visible()

    # Regression: V0.8 relationship canvas preserved and returns to source location.
    page.locator('[data-page="graph"]').click()
    assert page.locator('#page-graph').is_visible()
    assert int(page.locator('#graphNodeCount').inner_text()) == 14
    page.locator('#graphFocusMode').check()
    assert page.locator('#graphFocusDoc').count() == 1
    # From Markdown reader a programmatic graph/source locate must switch to line mode.
    page.locator('[data-page="audit"]').click()
    page.locator('#markdownTab').click()
    doc_id = page.evaluate('window.GameDocBridge.getDocs()[6].id')
    page.evaluate('(id)=>window.GameDocBridge.openDoc(id,7)', doc_id)
    assert page.locator('#previewPane').is_visible()
    assert page.locator('.source-line.highlight').count() == 1
    assert not page.locator('#markdownPane').is_visible()
    assert not errors, errors
    print('PASS: 14 documents imported, 2-line feedback scroll, vertical nav, selection, search, Markdown GFM tables, escaped HTML, preview editing, graph retained')
    print('screenshot',SCREENSHOT_PATH)
    print('feedback', info)
    browser.close()
