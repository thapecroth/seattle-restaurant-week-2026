"""Static guide interface and research snapshot checks."""
from pathlib import Path
import hashlib
import json
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = {
    'signature-data.json': 'f551f4b180ff3064ca38077d85577959047e47e0766e02b432760b3d1059e9ac',
    'frontier-engine.js': 'b0bddb3a589d454050daa15947a7ec052574514e7d2f6a9ca03ba96ae76b55f9',
    'signature-offers.csv': 'a4e0f0c012e6825c68cf87eeacbefdcbc516cfc6d70953d9e02798d484e5e8ae',
    'menus.csv': '50a6bb0745450f8f4e1a7798b7b0344b8ae7e6aa613c99cf51f241a34b256def',
    'discount-data.json': 'f9230e6ce6ef3e6107e3aeb0b2e56b860318a90c7d54814fac63c375c0be9594',
    'discount-engine.js': '818de2e3a986640103bf61f25dd02e83de757cd5cf3ab8aca644eae03fa43aab',
    'discount-offers.csv': 'c1f8ed42049d7bdd617a788a631348af834507db29a0e8bd6573fd3c01668915',
}

class GuideTests(unittest.TestCase):
    def test_accessible_main_contains_filters_and_research(self):
        soup = BeautifulSoup((ROOT / 'index.html').read_text(), 'lxml')
        self.assertIsNotNone(soup.main)
        for ident in ['restaurant-filters', 'signature-analysis', 'all']:
            self.assertIsNotNone(soup.main.select_one('#' + ident), ident)
        self.assertIsNotNone(soup.select_one('nav.site-nav'))

    def test_standard_filter_interface(self):
        for name, fields in [('index.html', ['#location-filter', '#cuisine-filter', '#search']),
                             ('discount.html', ['#discount-city', '#discount-cuisine', '#discount-search'])]:
            soup = BeautifulSoup((ROOT / name).read_text(), 'lxml')
            for field in fields:
                self.assertIsNotNone(soup.select_one(field), name + field)

    def test_research_snapshot(self):
        for name, expected in SNAPSHOT.items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), expected, name)
        for name, offers in [('signature-data.json', 'offers'), ('discount-data.json', 'comparisons')]:
            data = json.loads((ROOT / name).read_text())
            self.assertEqual(len(data['restaurants']), 275)
            self.assertEqual(sum(len(r[offers]) for r in data['restaurants']), 621)

    def test_directory_and_menu_snapshot(self):
        soup = BeautifulSoup((ROOT / 'index.html').read_text(), 'lxml')
        self.assertEqual(len(soup.select('.directory tbody tr')), 275)
        menus = sorted((x.select_one('summary').get_text(' ', strip=True), x.select_one('pre').get_text())
                       for x in soup.select('details[data-city]') if x.select_one('pre'))
        self.assertEqual(len(menus), 275)
        self.assertEqual(hashlib.sha256(json.dumps(menus, ensure_ascii=False).encode()).hexdigest(),
                         '51df48d716c90cb1f831926b7d11b509737cef828ba33863b1a00ac2bf737bc8')

if __name__ == '__main__':
    unittest.main()
