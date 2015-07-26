#!/usr/bin/env python
# -*- encoding: utf-8 -*-
#
# Eolo server, the god of the wind is using Tornado to serve
# html, js, css and JSON for the Non-Yet-Nominated-Snowden-Project
#

import sys
import os
import csv
import logging
import json
from tornado.web import Application, StaticFileHandler, RequestHandler
from tornado.ioloop import IOLoop as TornadoIOLoop
from tornado.util import bytes_type, unicode_type
from tornado import escape
from datetime import datetime
from termcolor import colored

# some code before the import that are from ".."
this_directory = os.path.dirname(__file__)
root = os.path.abspath(os.path.join(this_directory, '..'))
sys.path.insert(0, root)

LOGFILE='/tmp/eolo.log'


class Freegeoip(object):

    two2three = {}
    name2three = {}

    # supported weird names:
    supported_w = [ "Satellite Provider", "Europe", "Asia/Pacific Region" ]

    @classmethod
    def getfile(cls, fname):

        filfullpa = os.path.join('/home/qq/T/trackmapbackend/readonlydata', fname)
        return file(filfullpa)

    @classmethod
    def name_to_country_3lc(cls, name, absolute=False):

        if not Freegeoip.name2three:
            Freegeoip.name2three = json.load(Freegeoip.getfile('name_to_three.json'))

        while name[0] == ' ':
            name = name[1:]

        while name[-1] == ' ':
            name = name[0:-1]

        if len(name) == 3:
            three_lc = name
            return three_lc

        if name == 'Global':
            return None

        if name == 'EU':
            return None

        if name == 'South Korea':
            return 'KOR'

        if name == 'Taiwan':
            return 'TWN'

        if name == 'Venezuela':
            return 'VEN'

        if name == 'Vietnam':
            return 'VNM'

        if name == 'Bosnia':
            return 'BIN'

        if name == 'Russia':
            return 'RUS'

        if name == 'Iran':
            return 'IRN'

        if name == 'North Korea':
            return 'PRK'

        if name == 'Bolivia':
            return 'BOL'

        if name == 'the Baltic and the Middle East':
            return None

        if name == 'Africa':
            return None

        if name == 'Solomon islands':
            return 'SOL'

        if name == 'U.S.' or name == 'US':
            return 'USA'

        try:
            three_lc = Freegeoip.name2three[name]
        except KeyError as ke:
            if absolute:
                print "Error: required absolutely three letter code here: do 'print name'"
                import pdb; pdb.set_trace()
            if name not in Freegeoip.supported_w:
                print "Missing three letter code here: %s " % name
                raise ke
            three_lc = name

        return three_lc




class IndexHandler(RequestHandler):
    def get(self):

        if self.request.headers.has_key('Referer'):
            referer = self.request.headers['Referer']
        else:
            referer = None

        EoloHandler.counter += 1
        print " %s\t%s\t%s" % ( EoloHandler.counter,
                                    datetime.now().strftime('%d-%m %H:%M:%S'),
                                    referer)
        self.render("visualisation/index.html")


class EoloHandler(RequestHandler):

    counter = 0
    Cache = {}

    def get_cache(self):
        """
        :return: None if is not cached, the content if it is
        """
        if EoloHandler.Cache.has_key(self.request.uri):
            return EoloHandler.Cache[self.request.uri]
        else:
            return None

    def please_cache(self, stuff):
        # just put that shit in memory
        EoloHandler.Cache[self.request.uri] = stuff


    def write(self, chunk):
        """
        This is exactly a copy of the original Tornado RequestHandler.write,
        but here I'm supporting also the list as JSON
        """

        # the referer here is always the 'index', not the external entry.
        # because EoloHandler is used only in REST
        EoloHandler.counter += 1
        print " %s\t%s\t%s" % ( EoloHandler.counter,
                                datetime.now().strftime('%d-%m %H:%M:%S'),
                                self.request.uri)


        if self._finished:
            raise RuntimeError("Cannot write() after finish().  May be caused "
                               "by using async operations without the "
                               "@asynchronous decorator.")
        if not isinstance(chunk, (bytes_type, unicode_type, dict, list)):
            raise TypeError("write() only accepts bytes, unicode, and dict objects")
        if isinstance(chunk, (dict, list) ):
            chunk = escape.json_encode(chunk)
            self.set_header("Content-Type", "application/json; charset=UTF-8")
        chunk = escape.utf8(chunk)
        self._write_buffer.append(chunk)



def SnowdenSource(keyword):
    """
     'Source documents & publications'
     'Codename of surveillance programme(s)'
     'Target(s)'
     'Why?'
     'Type of surveillance'
     'Intelligence agencies'
    """
    if keyword == 'Source documents & publications':
        return "Sources"
    if keyword == 'Codename of surveillance programme(s)':
        return "Codename"
    if keyword == 'Target(s)':
        return "Target"
    if keyword == 'Why?':
        return "Why"
    if keyword == 'Type of surveillance':
        return "Type"
    if keyword == 'Intelligence agencies':
        return "ia"

    return keyword


class DataSource(object):

    immutable_source =  []
    country_list = []


    @classmethod
    def interpret_validate_csv(cls, keyword, line, i, category):

        clean_keyword = SnowdenSource(keyword)
        print colored("%s %s %s" % (keyword, i, category), 'blue', 'on_yellow' )

        if clean_keyword != 'Countries':
            return clean_keyword, line[i]

        # it is 'Countries', split in three letter code
        countries_list = line[i].split(',')
        three_letter_code_list = []
        for c in countries_list:
            print "[%s]" % c
            country_3lc = Freegeoip.name_to_country_3lc(c)
            if not country_3lc:
                print "Global/None spotted: continue :P"
                continue
            if not country_3lc in DataSource.country_list:
                DataSource.country_list.append(country_3lc)
            if not country_3lc in three_letter_code_list:
                three_letter_code_list.append(country_3lc)

        return clean_keyword, three_letter_code_list



    def __init__(self):

        id_number_matrix = {
            'Spying on Political Leaders' : '1',
            'Spying on Corporations' : '2',
            'Collaborations' : '3',
        }
        if not DataSource.immutable_source:

            for fname, fid in id_number_matrix.iteritems():

                with file('%s.csv' % fname) as fp:

                    csvlist = fp.read().split('\n')
                    csvobj = csv.reader(csvlist)
                    keywords = csvobj.next()

                    counter_id = 0
                    while True:
                        line = csvobj.next()
                        if not line:
                            break

                        counter_id += 1
                        mydict = dict({
                            'id' : int("%s%d" % (fid, counter_id))
                        })
                        for i, k in enumerate(keywords):

                            clean_keyword, content = DataSource.interpret_validate_csv(k, line, i, fname)
                            mydict.update({clean_keyword : content})

                        mydict.update({'category' : fname})
                        DataSource.immutable_source.append(mydict)

            assert len(DataSource.immutable_source), "Error in loading the stuff above"
            print DataSource.immutable_source[0].keys()


class CountriesList(EoloHandler, DataSource):

    def get(self):
        self.finish(DataSource.country_list)

class CompaniesList(EoloHandler, DataSource):

    def get(self):
        self.finish([])

class AssociatedDocuments(EoloHandler, DataSource):

    def get(self, three_lc, detail):
        # print three_lc, detail

        retlist = []
        print "to be sure", len(DataSource.country_list)
        for docinfo in DataSource.immutable_source:
            if three_lc in docinfo['Countries']:
                retlist.append(docinfo)

        self.finish(retlist)


class JSONlist(EoloHandler, DataSource):

    def get(self):
        self.finish(DataSource.immutable_source)


apiMap = [
    # public API
    (r"/countries", CountriesList),
    (r"/company/", CompaniesList),
    (r"/country/(.*)/(.*)", AssociatedDocuments),

    (r"/", IndexHandler),
    # public API
    (r"/list", JSONlist),
    # last: wildcard!
    (r"/(.*)", StaticFileHandler, {"path": 'visualisation/'}),

    # (r"/data/(.*)/id/(.*)", RoutesList),
    # (r"/company/(.*)", CompanyDetails),

]

if __name__ == "__main__":

    flogfname = '/tmp/eolo.log'

    try:
        logging.basicConfig(filename=flogfname,level=logging.DEBUG, format='%(asctime)s %(message)s')
    except IOError as jake:
        print "Unable to open logfile, fallback in /tmp"
        quit()

    print colored("EoloServer started!", 'green', 'on_white')

    # clean the cache!
    EoloHandler.Cache = {}

    try:
        application = Application(apiMap, debug=True)
        application.listen(8000)
    except Exception as xxx:
        print "Unable to bind port 8000: %s" % xxx
        logging.warn("Unable to bind port 8000: %s" % xxx)
        quit(-1)

    TornadoIOLoop.instance().start()

