#  Copyright 2016 Palo Alto Networks, Inc
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

"""
This module implements minemeld.ft.humio.HumioSearch, the Miner node for Humio search query HTTPS.
"""

from __future__ import absolute_import

import requests
import logging
import jmespath
import os
import yaml

from minemeld.ft.basepoller import BasePollerFT

LOG = logging.getLogger(__name__)


class HumioQuery(BasePollerFT):
    """Implements class for miners of JSON data returned from Humio.

    **Config parameters**
        age_out:
            default: How long discovered indicators should be kept within the EDL
            interval: How often (in seconds) the query should run
            sudden_death: Should indicators that no longer appear in query results be immediately revoked? (true/false)
        attributes:
            confidence: How confident we are indicators from this feed should be acted upon (1-100)
            share_level: Used for filtering by downstream nodes (green/yellow/red)
            type: Type of indicator being returned by the query (IPv4/IPv6/URL/domain)
        fields:
            - name-of-field
        Headers:
            ACCEPT: application/json
            Authorization: Bearer <YOUR_API_TOKEN>
            Cache-Control: no-cache
            content-type: application/json
        indicator: src_ip
        prefix: string to prepend to indicator, use for filtering by downstream nodes
        query_string: '<Humio_Search_API_Query>'
        source_name: Humio
        url: <Humio URL>
        verify_cert: false

    Example:
        Example config in YAML::

            age_out:
                default: 30d
                interval: 257
                sudden_death: false
            attributes:
                confidence: 100
                share_level: green
                type: IPv4
            extractor: '[]'
            fields:
            - src_ip
            headers:
                ACCEPT: application/json
                Authorization: Bearer 230824f0283fmasdlkfasdjf204
                Cache-Control: no-cache
                content-type: application/json
            indicator: src_ip
            prefix: humio.threatradar
            query_string: '{"queryString":"AlertAction = Block | AlertDescription = *ThreatDetected*
                | groupBy([src_ip])","start":"5minutes","end":"now","isLive":false}'
            source_name: Humio
            url: https://humio-instance.yourdomain.com/api/v1/dataspaces/repo_name/query
            verify_cert: false

        Args:
        name (str): node name, should be unique inside the graph
        chassis (object): parent chassis instance
        config (dict): node config.
    """

    def configure(self):
        super(HumioQuery, self).configure()

        self.url = self.config.get('url', None)
        self.polling_timeout = self.config.get('polling_timeout', 20)
        self.verify_cert = self.config.get('verify_cert', True)
        self.query_string = self.config.get('query_string', None)

        self.compile_error = None
        try:
            self.extractor = jmespath.compile(self.config.get('extractor', '@'))
        except Exception as e:
            LOG.debug('%s - exception in jmespath: %s',
                      self.name, e)
            self.compile_error = "{}".format(e)

        self.indicator = self.config.get('indicator', 'indicator')
        self.prefix = self.config.get('prefix', 'json')
        self.fields = self.config.get('fields', None)

        self.headers = self.config.get('headers', None)

        # option for enabling client cert, default disabled
        self.client_cert_required = self.config.get('client_cert_required', False)
        self.key_file = self.config.get('key_file', None)
        if self.key_file is None and self.client_cert_required:
            self.key_file = os.path.join(
                os.environ['MM_CONFIG_DIR'],
                '%s.pem' % self.name
            )
        self.cert_file = self.config.get('cert_file', None)
        if self.cert_file is None and self.client_cert_required:
            self.cert_file = os.path.join(
                os.environ['MM_CONFIG_DIR'],
                '%s.crt' % self.name
            )

        self.side_config_path = self.config.get('side_config', None)
        if self.side_config_path is None:
            self.side_config_path = os.path.join(
                os.environ['MM_CONFIG_DIR'],
                '%s_side_config.yml' % self.name
            )

        self._load_side_config()

    def _load_side_config(self):
        try:
            with open(self.side_config_path, 'r') as f:
                sconfig = yaml.safe_load(f)

        except Exception as e:
            LOG.error('%s - Error loading side config: %s', self.name, str(e))
            return

        api_url = sconfig.get('api_url', None)
        api_token = sconfig.get('api_token', None)
        query_string = sconfig.get('query_string', None)
        indicator_name = sconfig.get('indicator_name', None)
        prefix = sconfig.get('prefix', None)

        if api_url is not None and api_token is not None and query_string is not None and indicator_name is not None and prefix is not None:
            self.url = api_url
            self.api_token = api_token
            self.query_string = query_string
            self.indicator = indicator_name
            self.prefix = prefix
            self.headers["Authorization"] = "Bearer " + self.api_token
            LOG.info('{} - Loaded credentials from side config'.format(self.name))

    def hup(self, source=None):
        LOG.info('%s - hup received, reload side config', self.name)
        self._load_side_config()
        super(HumioQuery, self).hup(source)

    @staticmethod
    def gc(name, config=None):
        BasePollerFT.gc(name, config=config)

        side_config_path = None
        if config is not None:
            side_config_path = config.get('side_config', None)
        if side_config_path is None:
            side_config_path = os.path.join(
                os.environ['MM_CONFIG_DIR'],
                '{}_side_config.yml'.format(name)
            )

        try:
            os.remove(side_config_path)
        except:
            pass

        client_cert_required = False
        if config is not None:
            client_cert_required = config.get('client_cert_required', False)

        if config is not None:
            cert_path = config.get('cert_file', None)
            if cert_path is None and client_cert_required:
                cert_path = os.path.join(
                    os.environ['MM_CONFIG_DIR'],
                    '{}.crt'.format(name)
                )

            if cert_path is not None:
                try:
                    os.remove(cert_path)
                except:
                    pass

        if config is not None:
            key_path = config.get('key_file', None)
            if key_path is None and client_cert_required:
                key_path = os.path.join(
                    os.environ['MM_CONFIG_DIR'],
                    '{}.pem'.format(name)
                )

            if key_path is not None:
                try:
                    os.remove(key_path)
                except:
                    pass

    def _process_item(self, item):
        if self.indicator not in item:
            LOG.debug('%s not in %s', self.indicator, item)
            return [[None, None]]

        indicator = item[self.indicator]
        if not (isinstance(indicator, str) or
                isinstance(indicator, unicode)):
            LOG.error(
                'Wrong indicator type: %s - %s',
                indicator, type(indicator)
            )
            return [[None, None]]

        fields = self.fields
        if fields is None:
            fields = item.keys()
            fields.remove(self.indicator)

        attributes = {}
        for field in fields:
            if field not in item:
                continue
            attributes['%s_%s' % (self.prefix, field)] = item[field]

        return [[indicator, attributes]]

    def _build_iterator(self, now):
        if self.compile_error is not None:
            raise RuntimeError(self.compile_error)

        rkwargs = dict(
            stream=False,
            verify=self.verify_cert,
            timeout=self.polling_timeout,
            data=self.query_string
        )

        if self.headers is not None:
            rkwargs['headers'] = self.headers

        if self.client_cert_required and self.key_file is not None and self.cert_file is not None:
            rkwargs['cert'] = (self.cert_file, self.key_file)

        r = requests.post(
            self.url,
            **rkwargs
        )

        try:
            r.raise_for_status()
        except:
            LOG.debug('%s - exception in request: %s %s',
                      self.name, r.status_code, r.content)
            raise

        result = self.extractor.search(r.json())

        return result
