#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import random
import json
import time
import requests
import sys
import os
from HTMLParser import HTMLParser


global_list_json = []

url = 'https://freesnowden.is/revelations/'
global_csv = [ "id,title,url" ]

class LeakEntry:

    counter = 0

    def __init__(self, id):

        LeakEntry.counter += 1
        self.counter = LeakEntry.counter
        self.id = id
        self.title = ""
        # self.description = ""

    def finish(self):

        got = {
            'id' : self.counter,
            'title': self.title,
            'url': url + '#' + self.id,
            # 'description': self.description,
        }
        global_list_json.append(got)

        # x = '"' + self.title + '",' + '"' + url + '#' + self.id + '",' + '"' + self.description  + '"'
        x = '"' + "%s" % self.counter + '",' + '"' + url + '#' + self.id + '",' + '"' + self.title + '"'
        global_csv.append(x)


class MyHTMLParser(HTMLParser):

    def handle_starttag(self, tag, attrs):

        if tag == 'h2' and isinstance(attrs, list) and attrs[0][0] == 'id':

            assert self.last == None
            self.last = LeakEntry(attrs[0][1])

    def handle_endtag(self, tag):

        if tag == 'h2' and self.last:

            self.last.finish()
            self.last = None

    def handle_data(self, data):

        if self.last:

            self.last.title += data


p = MyHTMLParser()
p.last = None

try:
    time.sleep(1)
    aa = requests.get(url, verify=False)
except requests.exceptions.ConnectionError as xxx:
    raise xxx

p.feed(aa.content)


with file('output.json', 'w+') as jfp:
    json.dump(global_list_json, jfp)

with file('output.csv', 'w+') as jfp:
    jfp.write("\n".join(global_csv))


print "Done!"
