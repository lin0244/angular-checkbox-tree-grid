(function() {
  angular
    .module('template/treeGrid/checkBoxTreeGrid.html', [])
    .run([
      '$templateCache',
      function($templateCache) {
        $templateCache.put('template/treeGrid/checkBoxTreeGrid.html',
          "<div class=\"table-responsive\">\n" +
          " <table class=\"table table-bordered table-striped tree-grid\">\n" +
          "   <thead>\n" +
          "     <tr>\n" +
          "        <th style=\"width:5%;\" ng-if=\"checkboxTree\"><input type=\"checkbox\" ng-change=\"onRootSelect(rootNode)\" ng-model=\"rootNode\" /></th>\n" +
          "       <th>{{expandingProperty.displayName || expandingProperty.field || expandingProperty | translate}}</th>\n" +
          "       <th ng-repeat=\"col in colDefinitions\">{{col.displayName | translate}}</th>\n" +
          "     </tr>\n" +
          "   </thead>\n" +
          "   <tbody>\n" +
          "     <tr ng-repeat=\"row in tree_rows | filter:{visible:true} track by row.uid\"\n" +
          "       ng-class=\"'level-' + {{ row.level }} + (row.branch.selected ? ' active':'')\" class=\"tree-grid-row\">\n" +
          "       <td class=\"role-checkbox-tree-node\" style=\"width:5%;\" ng-if=\"checkboxTree\">\n" +
          "         <input class=\"node-control\" name=\"nodeControl\" type=\"checkbox\" ng-model=\"row.branch.selected\" ng-click=\"onSelect(row, row.branch.selected)\" /></td>" +
          "       <td><a ng-click=\"onBranchToggle(row)\" class=\"tree-branch-anchor\"><i ng-class=\"row.tree_icon\"\n" +
          "              class=\"indented\"></i>\n" +
          "           </a><span class=\"indented tree-label\" ng-click=\"onBranchClick({branch: row.branch})\">\n" +
          "             {{row.branch[expandingProperty.field] || row.branch[expandingProperty]}}</span>\n" +
          "       </td>\n" +
          "       <td ng-repeat=\"col in colDefinitions\">\n" +
          "         <div ng-if=\"col.cellTemplate\" compile=\"col.cellTemplate\"></div>\n" +
          "         <div ng-if=\"!col.cellTemplate\">{{row.branch[col.field]}}</div>\n" +
          "       </td>\n" +
          "     </tr>\n" +
          "   </tbody>\n" +
          " </table>\n" +
          "</div>\n" +
          "");

        $templateCache.put("template/test/test.html",
          "<ul class=\"nav nav-list nav-pills nav-stacked list-tree\">\n" +
          " <li ng-repeat=\"row in tree_rows | filter:{visible:true} track by row.uid\" \n" +
          "   ng-class=\"'level-' + {{ row.level }} + (row.branch.selected ? ' active':'')\">\n" +
          "   <a ng-click=\"(row.branch.children.length) ? onBranchToggle(row) : ''\">\n" +
          "     <i ng-class=\"row.tree_icon\" class=\"indented tree-icon\"></i>\n" +
          "     <span class=\"indented tree-label\" ng-click=\"onBranchClick({branch: row.branch})\">{{ row.branch[expandingProperty.field] || row.branch[expandingProperty] }}</span>\n" +
          "   </a>\n" +
          " </li>\n" +
          "</ul>\n" +
          "");
      }
    ]);

  angular
    .module('boxTree', [
      'template/treeGrid/checkBoxTreeGrid.html'
    ])
    .service('NgTreeGridService', function() {
      var self = this;
      var fieldName, uid, deselected;

      this.data = null;

      // grid configuration
      this.results = [];

      this.getData = function() {
        return self.data;
      };

      this.setData = function(data) {
        self.data = data;
      };

      this.setGridConfig = function(config, ep) {
        self.config = config;
        self.expandingProperty = ep;
        fieldName = config.childrenKeyName;
      };

      this.flattenTreeData = function(arr, level, visible, pid) {
        arr = arr || [];
        level = level || 1;
        visible = angular.isDefined(visible) ? visible : true;

        for (var i = 0; i < arr.length; i++) {
          uid = "" + Math.random();

          self.results.push({
            pid: pid,
            uid: uid,
            cid: 'c' + (11 * level + i),
            branch: arr[i],
            level: level,
            visible: visible,
            expanded: false,
            tree_icon: arr[i][fieldName].length ? self.config.iconExpand : ""
          });

          if (angular.isArray(arr[i][fieldName]) && arr[i][fieldName].length) {
            self.flattenTreeData(arr[i][fieldName], (level + 1), false, uid);
          }
        }
        self.attachChildNodes(self.results);
        return self.results;
      };

      // return children of each object
      this.attachChildNodes = function(arr) {
        angular.forEach(arr, function(o, i) {
          arr[i].children = self.getChildNodes(arr, arr[i].uid) || [];
        });
      };

      this.onDataChange = function(newArr, oldArr) {
        self.results = [];
        self.flattenTreeData(newArr);
      };

      this.onBranchChange = function(arr, filter) {
        return arr.filter(function(c) {
          return (angular.isDefined(filter) && filter) ? c.branch.selected : !c.branch.selected;
        });
      };

      this.onToggle = function(row, arr) {
        angular.forEach(arr, function(o, i) {
          if (!angular.isUndefined(arr[i].pid) && arr[i].pid == row.uid) {
            arr[i].visible = row.expanded;

            if (!row.expanded && arr[i].expanded) {
              arr[i].expanded = false;
            }

            if (arr[i].children.length) {
              self.onToggle(arr[i], arr);
            }
          }
        });
      };

      this.onRootSelect = function(selection) {
        for (var i = 0; i < self.results.length; i++) {
          self.results[i].branch.selected = selection;
        }
      };

      this.reduceTreeData = function() {
        return self.onBranchChange(self.results, true).map(function(o) {
          return o.branch;
        });
      };

      this.onSelect = function(row, selection, callback) {
        self.checkChildNodes(row, selection);
        //self.onChildSelection(self.results, self.getDeselectedNodes());
        self.updateNodesCheck(row.level, self.results);
      };

      this.getDeselectedNodes = function() {
        return self.onBranchChange(self.results, false);
      };

      this.isRootNodeSelected = function() {
        var _dn = self.getDeselectedNodes();
        return (angular.isArray(_dn) && _dn.length) ? false : true;
      };

      this.getTreeModel = function() {
        return self.onBranchChange(self.results, true);
      };

      this.checkChildNodes = function(row, selection) {
        for (var i = 0; i < self.results.length; i++) {
          if (self.results[i].pid == row.uid) {
            self.results[i].branch.selected = selection;

            if (self.results[i].branch[fieldName].length) {
              self.checkChildNodes(self.results[i], selection);
            }
          }
        }
      };

      this.getNodes = function(arr, level) {
        return arr.filter(function(c) {
          return c.level == level;
        });
      };

      // get parent nodes
      this.recursiveCheck = function(a, level) {

        level = level || 1;
        var nodes = self.getNodes(a, level);
        for (var i = 0; i < nodes.length; i++) {
          var children = self.getChildNodes(a, nodes[i].uid) || [];
          if (children.length) {
            nodes[i].branch.selected = children.every(self.allSelected);

            // perform check on selected attribute
            for (var j = 0; j < children.length; j++) {
              if (children[j].branch[fieldName].length) {
                self.recursiveCheck(a, (level + 1));
              }
            }
          }
        }
      };

      this.updateNodesCheck = function(level, arr) {
        while (level > 0) {
          self.recursiveCheck(arr, level);
          level--;
        }
      };

      this.getChildNodes = function(arr, uid) {
        return arr.filter(function(c) {
          return c.pid == uid;
        });
      };

      this.allSelected = function(elem) {
        return elem.branch.selected;
      };

      this.onChildSelection = function(a, b) {
        if (angular.isArray(b) && b.length) {
          for (var i = 0; i < a.length; i++) {
            for (var j = 0; j < b.length; j++) {
              if (b[j].level > 1 && b[j].pid == a[i].uid) {
                a[i].branch.selected = b[j].branch.selected;
              }
            }
          }
        }
      };

      this.onBranchToggle = function(row) {
        row.expanded = !row.expanded;
        row.tree_icon = (row.expanded) ? self.config.iconCollapse : self.config.iconExpand;
        self.onToggle(row, self.results);
      };

      this.onTreeDataChange = function(n, o) {
        return self.onBranchChange(n, true);
      };

      this.onTreeModelChange = function(n, o) {
        if (angular.isArray(n)) {
          for (var i = 0; i < n.length; i++) {
            for (var j = 0; j < self.results.length; j++) {
              if (n[i][self.expandingProperty['field']] ==
                self.results[j].branch[self.expandingProperty['field']]) {
                self.results[j].branch.selected = n[i].selected;
              }
            }
          }
        }
      };
    })
    .directive('compile', [
      '$compile',
      function($compile) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            // Watch for changes to expression.
            scope.$watch(attrs.compile, function(new_val) {
              /*
               * Compile creates a linking function
               * that can be used with any scope.
               */
              var link = $compile(new_val);

              /*
               * Executing the linking function
               * creates a new element.
               */
              var new_elem = link(scope);

              // Which we can then append to our DOM element.
              element.append(new_elem);
            });
          }
        };
      }
    ])

  .directive('boxTree', [
      '$timeout',
      'checkBoxTreeGridTemplate',
      '$templateCache',
      'NgTreeGridService',
      function($timeout,
        checkBoxTreeGridTemplate, $templateCache, NgTreeGridService) {
        return {
          restrict: 'E',
          templateUrl: function(tElement, tAttrs) {
            return tAttrs.templateUrl || checkBoxTreeGridTemplate.getPath();
          },
          replace: true,
          scope: {
            treeData: '=',
            colDefs: '=',
            expandOn: '=',
            onSelect: '&',
            treeControl: '=',
            treeModel: '=',
            treeConfig: '=',
            onBranchClick: '&'
          },
          link: function(scope, element, attrs) {
            var treeConfig;

            //scope.treeModel = null;

            // grid configuration
            scope.results = [];


            // initialize root node
            scope.rootNode = false;


            // set expanding property
            scope.expandingProperty = scope.expandOn;


            treeConfig = angular.extend({}, checkBoxTreeGridTemplate.getGridConfig(), scope.treeConfig);
            scope.checkboxTree = (treeConfig.checkboxTree) ? treeConfig.checkboxTree : false;


            // set grid config
            NgTreeGridService.setGridConfig(treeConfig, scope.expandOn);

            scope.$watch('treeModel', NgTreeGridService.onTreeModelChange, true);
            scope.$watch('rootNode', function(n, o) {
                  console.log('Root node: ' + o);
            }, true);
            scope.tree_rows = NgTreeGridService.flattenTreeData(scope.treeData) || [];
            console.log(scope.tree_rows);

            scope.onBranchToggle = function(row) {
              NgTreeGridService.onBranchToggle(row);
            };

            scope.onSelect = function(row, selection) {
              NgTreeGridService.onSelect(row, selection);
              scope.treeModel = NgTreeGridService.getTreeModel();
              scope.rootNode = NgTreeGridService.isRootNodeSelected();
            };

            scope.$watch('rootNode', function(n, o) {
              console.log('New Root Node Value is: ' + n);
            }, true);

            scope.onRootSelect = function(selection) {
              NgTreeGridService.onRootSelect(selection);
              scope.treeModel = NgTreeGridService.getTreeModel();
            };
          }
        };
      }
    ])
    .provider('checkBoxTreeGridTemplate', function() {
      var templatePath = 'template/treeGrid/checkBoxTreeGrid.html';
      var gridConfig = {
        checkboxTree: false,
        childrenKeyName: 'children',
        expandLevel: 1,
        iconCollapse: "fa fa-angle-down",
        iconExpand: "fa fa-angle-right",
        tableType: "table-bordered table-striped table-hover"
      };

      function setPath(path) {
        templatePath = path;
      }

      function getPath() {
        return templatePath;
      }

      function setGridConfig(config) {
        gridConfig = config;
      }

      function getGridConfig() {
        return gridConfig;
      }

      this.$get = function() {
        return {
          setPath: setPath,
          getPath: getPath,
          setGridConfig: setGridConfig,
          getGridConfig: getGridConfig
        };
      };
    });
}).call(window);