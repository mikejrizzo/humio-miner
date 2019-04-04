console.log('Loading Humio-miner WebUI');

(function() {

function Humio-Miner-SideConfigController($scope, MinemeldConfigService, MineMeldRunningConfigStatusService,
                                       toastr, $modal, ConfirmService, $timeout) {
    var vm = this;

    // side config settings
    vm.api_url = undefined;
    vm.api_token = undefined;
    vm.query_string = undefined;
    vm_field_name = undefined;
    vm_prefix = undefined;

    vm.loadSideConfig = function() {
        var nodename = $scope.$parent.vm.nodename;

        MinemeldConfigService.getDataFile(nodename + '_side_config')
        .then((result) => {
            if (!result) {
                return;
            }

            if (result.api_url) {
                vm.api_url = result.api_url;
            } else {
                vm.api_url = undefined;
            }

            if (result.api_token) {
                vm.api_token = result.api_token;
            } else {
                vm.api_token = undefined;
            }

            if (result.query_string) {
                vm.query_string = result.query_string;
            } else {
                vm.query_string = undefined;
            }

            if (result.field_name) {
                vm.field_name = result.field_name;
            } else {
                vm.field_name = undefined;
            }

            if (result.prefix) {
                vm.prefix = result.prefix;
            } else {
                vm.prefix = undefined;
            }

        }, (error) => {
            toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            vm.api_url = undefined;
            vm.api_token = undefined;
            vm.query_string = undefined;
            vm_field_name = undefined;
            vm_prefix = undefined;
        });
    };

    vm.saveSideConfig = function() {
        var side_config = {};
        var hup_node = undefined;
        var nodename = $scope.$parent.vm.nodename;

        if (vm.api_url) {
            side_config.api_url = vm.api_url;
        }
        if (vm.api_token) {
            side_config.api_token = vm.api_token;
        }
        if (vm.query_string) {
            side_config.query_string = vm.query_string;
        }
        if (vm.field_name) {
            side_config.field_name = vm.field_name
        }
        if (vm.prefix) {
            side_config.prefix = vm.prefix
        }

        return MinemeldConfigService.saveDataFile(
            nodename + '_side_config',
            side_config,
            nodename
        );
    };

    vm.setAPIURL = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.seturl.modal.html',
            controller: ['$modalInstance', humio-search-url-controller],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.api_url = result.api_url;

            return vm.saveSideConfig().then((result) => {
                toastr.success('API URL SET');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR SETTING API URL: ' + error.statusText);
            });
        });
    };

    vm.setAPIToken = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.settoken.modal.html',
            controller: ['$modalInstance', humio-search-token-controller],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.api_token = result.api_token;

            return vm.saveSideConfig().then((result) => {
                toastr.success('API TOKEN SET');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR SETTING API TOKEN: ' + error.statusText);
            });
        });
    };
    vm.setQueryString = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.setqs.modal.html',
            controller: ['$modalInstance', humio-search-qs-controller],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.query_string = result.query_string;

            return vm.saveSideConfig().then((result) => {
                toastr.success('API QUERY STRING SET');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR SETTING API QUERY STRING: ' + error.statusText);
            });
        });
    };
    vm.setFieldName = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.setfieldname.modal.html',
            controller: ['$modalInstance', humio-search-fieldname-controller],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.field_name = result.field_name;

            return vm.saveSideConfig().then((result) => {
                toastr.success('FIELD NAME SET');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR SETTING FIELD NAME: ' + error.statusText);
            });
        });
    };
    vm.setPrefix = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.setprefix.modal.html',
            controller: ['$modalInstance', humio-search-prefix-controller],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.prefix = result.prefix;

            return vm.saveSideConfig().then((result) => {
                toastr.success('PREFIX SET');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR SETTING PREFIX: ' + error.statusText);
            });
        });
    };

    vm.loadSideConfig();
}

function humio-search-url-controller($modalInstance) {
    var vm = this;

    vm.api_url = undefined;

    vm.valid = function() {
        if (!vm.api_url) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.api_url = vm.api_url;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function humio-search-token-controller($modalInstance) {
    var vm = this;

    vm.api_token = undefined;
    vm.api_token2 = undefined;

    vm.valid = function() {
        if (vm.api_token2 !== vm.api_token) {
            angular.element('#fgPassword1').addClass('has-error');
            angular.element('#fgPassword2').addClass('has-error');

            return false;
        }
        angular.element('#fgPassword1').removeClass('has-error');
        angular.element('#fgPassword2').removeClass('has-error');

        if (!vm.api_token) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.api_token = vm.api_token;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function humio-search-qs-controller($modalInstance) {
    var vm = this;

    vm.query_string = undefined;

    vm.valid = function() {
        if (!vm.query_string) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.query_string = vm.query_string;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function humio-search-fieldname-controller($modalInstance) {
    var vm = this;

    vm.field_name = undefined;

    vm.valid = function() {
        if (!vm.field_name) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.field_name = vm.field_name;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function humio-search-prefix-controller($modalInstance) {
    var vm = this;

    vm.prefix = undefined;

    vm.valid = function() {
        if (!vm.prefix) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.prefix = vm.prefix;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

angular.module('humio_search_miner_Webui', [])
    .controller('Humio-Miner-SideConfigController', [
        '$scope', 'MinemeldConfigService', 'MineMeldRunningConfigStatusService',
        'toastr', '$modal', 'ConfirmService', '$timeout',
        Humio-Miner-SideConfigController
    ])
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('nodedetail.msftwdatpoutputinfo', {
            templateUrl: '/extensions/webui/humio_search_miner_Webui/humio-search.miner.output.info.html',
            controller: 'NodeDetailInfoController',
            controllerAs: 'vm'
        });
    }])
    .run(['NodeDetailResolver', '$state', function(NodeDetailResolver, $state) {
        NodeDetailResolver.registerClass('humio-miner.node.Output', {
            tabs: [{
                icon: 'fa fa-circle-o',
                tooltip: 'INFO',
                state: 'nodedetail.humiominerinfo',
                active: false
            },
            {
                icon: 'fa fa-area-chart',
                tooltip: 'STATS',
                state: 'nodedetail.stats',
                active: false
            },
            {
                icon: 'fa fa-asterisk',
                tooltip: 'GRAPH',
                state: 'nodedetail.graph',
                active: false
            }]
        });

        // if a nodedetail is already shown, reload the current state to apply changes
        // we should definitely find a better way to handle this...
        if ($state.$current.toString().startsWith('nodedetail.')) {
            $state.reload();
        }
    }]);
})();