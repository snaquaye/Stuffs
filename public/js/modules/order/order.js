/**
* orders Module
*
* Description
*/
angular.module('order', []).

config(['$routeProvider',function($routeProvider){
  $routeProvider.when('/orders', {templateUrl: '/orders/all', controller: 'ordersIndexController'})
  .when('/dashboard/orders/cart', {templateUrl: '/orders/cart', controller: 'orderCartController'})
  .when('/dashboard/order', {templateUrl: '/orders/add', controller: 'orderAddController'})
  .when('/dashboard/order/:itemId', {templateUrl: '/orders/add', controller: 'orderAddController'});
}])
.controller('orderCartController', ['$scope', '$http', 'ordersService', '$localStorage', function($scope, $http, oS, $localStorage){
  
  $scope.placeOrder = function(){
    oS.postCart($scope.basket, function(list){
      var clone = _.clone($scope.orderCart);

      _.each(clone, function(v ,i){
        if(_.indexOf(list, v.itemId) > -1){
          $scope.orderCart.splice(i, 1);
        }
      });
      $scope.$storage.orderCart = __cleanJSON($scope.orderCart);
    });
  };

}])
.controller('ordersIndexController', function($scope, $http, $location, ordersService){
  $scope.getStatus = function getStatus (status){
    var d;
    switch(status){
      case 'pending order':
        d = 'supplied';
        //scope.orders[attrs.thisIndex].next ="Supplied";
      break;
      case 'supplied':
        d = 'paid';
        //scope.orders[attrs.thisIndex].next ="Paid";
      break;
      case 'paid':
       d = 'Complete';
      break;
      case 'received':
        d = 'supplied';
      break;
      case 'dispatched':
        d = 'supplied';
      break;
      default:
      d = null;
      break;
    }
    return d;
  };  
  (function(){
    $scope.orders = [];
    ordersService.orders(function(r){
      angular.forEach(r, function(v, i){
        v.nextStatus = $scope.getStatus(v.orderStatus);
        $scope.orders.push(v);
      });
    });
  }());

  $scope.removeOrder = function(event, order_id){
    var currentItem = event.currentTarget;
    console.log(currentItem);
    ordersService.remove(order_id, function(o){
      if(o.state === 1){
        $(currentItem).parents('tr').remove();
      }
    });
  };
  $scope.changeStatus = function(){
    var o = {
      status : $scope.uo.status,
      itemData : $scope.uo.itemData,
      amount : $scope.uo.amount,
      order_id : $scope.uo.order_id,
      invoiceno : $scope.uo.invoiceno
    };
    ordersService.updateOrder(o,function(r){

    });
  };
})
.controller('orderAddController',function($scope, $http, $location, ordersService,itemsService, $routeParams){
  $scope.form = {
    itemData: {},
    supplierData: {}
  };
  $scope.modal = {};
  if($routeParams.itemId){
    itemsService.summary($routeParams.itemId, 'main', function(r){
      $scope.summary = r;
      $scope.form.itemData.itemName = r.itemName;
      $scope.form.itemData._id = r._id;
      $scope.form.nafdacRegNo = r.nafdacRegNo;
      $scope.form.nafdacRegName = r.itemName;
      $scope.form.suppliers = {
        supplierName : r.supplierName,
        supplierID : r.supplierID
      };
    });
  }

  $scope.toggle = function(){
    $scope.plcordr = !$scope.plcordr;
    $scope.searchndl = !$scope.searchndl;
  };

  $scope.searchcmp = function(p, cb){
    $scope.ds = '';
    var page = p || 0;
    ordersService.searchCmp($scope.drugcmp,'composition', page, function(r){
      $scope.cmps = r;
      //Callback passed to paginate directive
      if(r !== false && !_.isEmpty(r)){
        $scope.supplierList = r;
        if(typeof(cb) === 'function')cb(true);
      }else{
        if(typeof(cb) === 'function')cb(false);
      }      
    });
  };


  $scope.more = function (index) {
    ordersService.moreInfo($scope.cmps[index]._id, function(r){
      $scope.ds = r;
      $scope.ds.index = index;
    });
  };

  $scope.orderthis = function(){
    if($scope.ds.length === 0) return false;
    $scope.form = {
      orderType: 'Medication',
      itemData : {
        itemName: $scope.ds.productName
      },
      suppliers:{
        supplierName: $scope.ds.man_imp_supp
      },
      nafdacRegNo: $scope.ds.composition,
      nafdacRegName: $scope.ds.productName
    };
    $scope.toggle();
  };

  $scope.saveButtonClass = 'btn-primary';
  $scope.submitOrder = function(){
    ordersService.save($scope.form, function(data){
      $scope.form = '';
    });
  };
})
.factory('ordersService',['$http', 'Notification','Language', function($http, Notification, Lang){
    var f = {};
    f.searchCmp = function(srchstr, catrcmp, page, callback){
      $http.get('/api/orders/ndl/'+srchstr+'/'+catrcmp+'/'+page)
      .success(function(d, r){
        if(_.isEmpty(d)){
          Notification.notifier({
            message: Lang.eng.order.search.notfound,
            type: 'error'
          });          
        }
        callback(d);
      })
      .error(function(d, r){
        Notification.notifier({
          message: Lang.eng.order.search.error,
          type: 'error'
        });
      });
    }
    f.getAllSuppliers = function(callback){
      $http.get('/api/orders/suppliers/'+escape(query)).success(function(data){
        callback(data);
      });
    };
    f.getSupplierName = function(query, callback){
      // $http.get('/api/orders/supplier/typeahead/'+query).success(function(data){
      //   callback(data);
      // });
      $.getJSON('/api/orders/supplier/typeahead/'+escape(query), function(s) {
          var results = [];
          $.each(s,function(){
            results.push(this.supplierName);
          });
          callback(results);
      });
    };
    f.orders = function(callback){
      var res = [];
      $http.get('/api/orders').success(function(data){
        var r = data;
        angular.copy(r,res);
        return callback(res);
      });
    };
    f.postCart = function(form, callback){
      $http.post('/api/orders/cart', form).
        success(function(data) {
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
            callback(data);
        }).
        error(function(err){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });          
        });
    };
    f.save = function(form, callback){
      $http.post('/api/orders', form).
        success(function(data) {
          Notification.notifier({
            message : Lang.eng.order.place.success,
            type: 'success'
          });
            callback(data);
        }).
        error(function(err){
          Notification.notifier({
            message : Lang.eng.order.place.error,
            type: 'error'
          });          
        });
    };
    f.updateOrder = function(o,callback){
      $http.put('/api/orders/'+escape(o.order_id), {
          "status": o.status,
          "itemData":o.itemData,
          "amount":o.amount,
          "orderInvoiceNumber": o.invoiceno,
          "amountSupplied": o.amountSupplied || undefined
        })
      .success(function(data){
        Notification.notifier({
          message: Lang.eng.order.update.success,
          type: 'success'
        });
        callback(data);
      })
      .error(function(data){
        Notification.notifier({
          message: Lang.eng.order.update.error,
          type: 'error'
        });        
      });

    };
    f.count = function(callback){
      $http.get('api/orders/count').
        success(function(d){
          callback(d);
        });
    };
    f.remove = function(order_id, callback){
      $http.delete('/api/orders/'+order_id)
      .success(callback);
    };
    f.moreInfo = function (id, callback) {
      $http.get('/api/orders/ndl/' + id + '/summary')
      .success(function (d) {
        callback(d);
      })
      .error(function (d) {
        Notification.notifier({
          message: Lang[Lang.set].order.summary.error,
          type: 'error'
        });
      });
    };

    return f;
}]).directive('orderSupplierTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getSupplierName(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(name){
          _.some(nx, function(v,i){
            if(v.supplierName === name){
              scope.form.suppliers = {
                supplierID : v._id,
                supplierName: v.supplierName
              };
              return true;
            }
          });          
          scope.$apply();
          return name;
        }
      });
  };
  return {
    link: linker
  };
}])
.directive('orderItemTypeAhead', ['itemsService', function(itemsService){
  var linker = function(scope, element, attrs){
    var nx;
      element.typeahead({
        source: function(query, process){
          return itemsService.getItemName(query,function(results, s){
            nx = s;
            return process(results);
          });
        },
        updater: function(name){
          itemsService.summary(name,'main', function(r){
            scope.form.itemData.itemName = r.itemName;
            scope.form.itemData._id = r._id;
            scope.form.suppliers = {
              supplierID : r.suppliers[0]._id,
              supplierName: r.suppliers[0].supplierName
            };
            scope.form.nafdacRegNo = r.nafdacRegNo;
            scope.form.nafdacRegName = r.itemName;            
            scope.summary = r;
          });
          scope.$apply();
          return name;
        }
      });
  };
  return {
    link: linker
  };
}])
.directive('orderList', ['ordersService','Notification','Language', function(OS, N, L){
  function link (scope, element, attrs) {
    

  }
  function Ctrlr ($scope){
  
    $scope.updateOrder = function(index){
      var o ={
        status : $scope.orderList[index].nextStatus,
        itemData : $scope.orderList[index].itemData[0],
        amount : $scope.orderList[index].orderAmount,
        order_id : $scope.orderList[index]._id,
        invoiceno : $scope.orderList[index].orderInvoice,
        amountSupplied: $scope.orderList[index].amountSupplied
      };
      OS.updateOrder(o, function(r){
        $scope.orderList[index].orderStatus = r.result;
        $scope.orderList[index].nextStatus = $scope.getStatus(r.result);
        if(r.result == 'supplied' && $scope.orderList[index].amountSupplied !== $scope.orderList[index].amount){
          N.notifier({
            message: L[L.set].order.update.amountDis,
            type: 'info'
          });
        }
      });
    };


    $scope.removeOrder = function(event, order_id){
      var currentItem = event.currentTarget;
      console.log(currentItem);
      OS.remove(order_id, function(o){
        if(o.state === 1){
          $(currentItem).parents('tr').remove();
        }
      });
    };    

  }
  return {
    link: link,
    controller: Ctrlr,
    scope: {
      orderList: '=',
      ordersFilter: '=',
      getStatus: '&'
    },
    templateUrl: '/templates/order-list'
  };
}]);