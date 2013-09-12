/**
*  item Module
*
* Description
*/
angular.module('item', ['ui.bootstrap'])

.config(['$routeProvider', function ($routeProvider){
	$routeProvider.when('/items', {templateUrl: '/items/index', controller: 'itemIndexController'})
  .when('/items/add', {templateUrl: '/items/new', controller: 'itemAddController'})
  .when('/items/locations', {templateUrl: '/items/stockdown', controller: 'itemStockController'})
	.when('/items/dispensary', {templateUrl: '/items/dispense', controller: 'itemDispensaryController'})
  .when('/items/:itemId/edit',{templateUrl: '/items/new', controller: 'itemEditController'});
}])
.controller('itemIndexController', function itemIndexController($scope, $location, $routeParams,itemsService){
    function init(){
      $scope.summary = {};
      $scope.form = {};
      $scope.itemsList = {};
      $scope.hasItems = false;
      itemsService.items(function(data){
        if(data.length > 0){
          $scope.hasItems = true;
          $scope.itemsRaw = data;
          $scope.itemsList = sortItems(data);
          $scope.enabledIndex = Object.keys($scope.itemsList);
        }
      });
    }
    init();
    function sortItems(data){
      var o = {};
      data.forEach(function(ele,index,arr){
        if(ele.itemName){
          var fchar = ele.itemName.split("");
          if(o[fchar[0]] ===  undefined){
            o[fchar[0]] = [];
          }
          o[fchar[0]].push(ele);
        }
      });
      return o;
    }
    function atoz(){
      var a = [], i = 65;
      for (i;i<=90;i++){
        a[a.length] = String.fromCharCode(i);
      }
      return a;
    }
    $scope.stockFilters = [{
      "value": "",
      "text": "All Stock"
    },{
      "value": "good-stock",
      "text": "Good Stock"
    },{
      "value": "low-stock",
      "text": "Low Stock"
    },{
      "value": "empty-stock",
      "text": "Empty Stock"
    }];
    $scope.indexes =  atoz();
    $scope.summaryDo =  function (id){
      itemsService.summary(id,function(res){
        $scope.summary = res;
        $scope.spmenu = 'cbp-spmenu-open';
        $('html').click(function(){
          $scope.spmenu = '';
          $scope.$apply();
        });
        $('nav.cbp-spmenu').click(function(event){
          event.stopPropagation();
        });
      });
    };
})
.controller('itemAddController', function itemAddController ($scope, $location, $routeParams,itemsService){
  $scope.form = {};
  $scope.modal ={};
  $scope.saveButtonClass = 'btn-primary';
  $scope.isDisabled = false;
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.save($scope.form, function(status,res){
      if(status){
        $scope.$parent.modal.heading= 'Item Added';
        $scope.$parent.modal.body= "You've succesfull added an order. Note: Items placed with invoice numbers and stock amounts will have their current stock updated. To add another item, close this dialog or return to the dashboard";
        $scope.form = '';
        $('.md-modal').addClass('md-show md-success');
        $('.md-overlay').addClass('success-overlay');
        $scope.saveButtonText = 'Save Item';
        $scope.saveButtonClass = 'btn-primary';
      }else{
        $scope.$parent.modal.heading= 'Error Adding Item';
        $scope.$parent.modal.body= "Something went wrong while carrying out your last request. If it's nothing serious, you can try again. If this error happens again, please inform the Admin";
        $('.md-modal').addClass('md-show md-error');
        $('.md-overlay').addClass('error-overlay');
        $scope.saveButtonText = 'Save Item';
      }
    });
  };
})
.controller('itemEditController', function itemEditController($scope, $location, $routeParams,itemsService){
  $scope.form = {};
  if(!isNaN($routeParams.itemId)){
    itemsService.getItemFields($routeParams.itemId, function(item){
      $scope.form = item;
    });
  }
  $scope.saveitem = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.update($scope.form, function(status,res){
      if(status){
        $scope.modal.heading= 'Item Updated';
        $scope.modal.body= "Close this dialog or return to the dashboard";
        $scope.modal.class= 'md-success';
        $scope.modal.modalState= 'md-show';
        $scope.saveButtonText = 'Save Item';
        $scope.saveButtonClass = 'btn-primary';
      }else{
        $scope.$parent.modal.heading= 'Error Adding Item';
        $scope.$parent.modal.body= "Something went wrong while carrying out your last request. If it's nothing serious, you can try again. If this error happens again, please inform the Admin";
        $('.md-modal').addClass('md-show md-error');
        $('.md-overlay').addClass('error-overlay');
        $scope.saveButtonText = 'Save Item';
      }
    });
  };
})
.controller('itemStockController',['$scope','$location','$routeParams','itemsService',function itemAddController ($scope, $location, $routeParams,itemsService){
  
  function init(){
    //Location Array
    $scope.locations = [];

    //Stores the requested drugs / items list
    $scope.requestform = {
      request: [],
      requestList : [],
      location: ''
    };

    //Text on the buttons
    $scope.addButtonText = 'Add';
    $scope.addHelpText = '';
    var thisItemName = '';
    $scope.stockDownRecord = [] ;
    $scope.hasItems = false;
  }
  init();


  // Watch for changes in the selectedItem model scope and 
  $scope.$watch('selectedItem.itemname', function(newValue, oldValue){
    if(newValue !== oldValue){
      thisItemName = newValue;
    }
  });
  $scope.addDrug = function(){
    $scope.addHelpText = '';
    itemsService.summary(thisItemName, function(c){
      if(_.indexOf($scope.requestform.requestList, thisItemName) < 0){
        $scope.requestform.requestList.push(thisItemName);
        $scope.requestform.request.push(c);
      }else{
        alert('This item is in the list already');
      }
    });
  };
  $scope.sendIt = function(){
    var drugs = [];
    _.forEach($scope.requestform.request, function(i,v){
      drugs.push({"_id":i._id,"amount":i.amount,"itemName":i.itemName,"itemID": i.itemID});
    });
    var sendDis = {"location":$scope.requestform.location,"request": $scope.requestform.request};
    itemsService.stockdown(sendDis, function(c){
      console.log('refresh list');
      //$scope.stockDownRecord.push(c);
    });
  };
  $scope.removeDrug = function(index){
    $scope.requestform.request.splice(index, 1);
    $scope.requestform.requestList.splice(index, 1);
    $scope.$apply();
  };


  // Gets the stock down points from the server
  itemsService.getPoints(function(res){
    $scope.locations = res;
  });
  $scope.saveButtonClass = 'btn-primary';

  $scope.createPoint = function(){
    $scope.saveButtonText = 'saving';
    $scope.saveButtonClass = 'btn-info';
    itemsService.saveLocation($scope.location, function(res){
      $scope.saveButtonText = 'SAVED';
      $scope.saveButtonClass= 'btn-success';
      $scope.modalstate = false;
      $scope.locations.push(res);
    });
  };
  $scope.onLocation = function(id){
    itemsService.showStockDown(id, function(data, response){
      $scope.hasItems = true;
      $scope.stockDownRecord = data;
    });
  }
}])
.controller('itemDispensaryController', function itemDispensaryController($scope,$location,$routeParams,itemsService){
  function init(){
    //Holds the form for dispensing drugs to a patient.
    //Patient Name, Number, Type and the Drugs list
    $scope.dispenseform = {
      prescription: [],
      cost: 0
    };
    // Gets the stock down points from the server
    itemsService.getPoints(function(res){
      $scope.locations = res;
    });  
    $scope.drugsList = [];
    //Previously Dispensed Records. Get populated by the init function
    $scope.dispenseHistory = [];
    //Initiate Modal Scope
    $scope.modal = {};    
  }
  init();
  $scope.addButtonText = 'Add';
  $scope.addHelpText = '';
  $scope.$watch('selectedItem.itemname', function(newValue, oldValue){
    if(newValue !== oldValue){
      $scope.thisItemName = newValue;
    }
  });
  var i = 0;
  $scope.d = {};
  $scope.addDrug = function(){
    $scope.addHelpText = '';
    itemsService.summary($scope.thisItemName, function(c){
      if(_.indexOf($scope.drugsList, $scope.thisItemName) < 0){
        $scope.drugsList.push($scope.thisItemName);
        $scope.d[i] = c;
        i++;
      }
    });
  };
  $scope.prescribeThis = function(d){
    $scope.drugname = '';
    if(d.options == 'alternative'){
      $scope.addHelpText = 'This is an alternative to '+d.itemName;
      $scope.dispenseform.prescription.push(d);
      return;
    }
    if(d.amount < d.currentStock){
      $scope.dispenseform.prescription.push(d);
    }
  };
  $scope.approveThis = function(){
    $scope.modal.heading= 'Confirm Prescription';
    $scope.modal.class= 'md-success';
    $scope.modal.modalState= 'md-show';
  };
  $scope.sendDis = function(){
    var drugs = [];
    _.forEach($scope.dispenseform.prescription, function(i,v){
      drugs.push({"_id":i._id,"amount":i.amount,"itemName":i.itemName,"itemID": i.itemID,"status":i.options});
    });
    var sendDis = {"patientName":$scope.dispenseform.patientName,"patientId": $scope.dispenseform.patientno,"company": $scope.dispenseform.company,"drugs": drugs};
    itemsService.dispense(sendDis, function(c){
      $scope.dispenseHistory.push(c);
    });
  };
  $scope.removeDrug = function(index){
    $scope.drugsList.splice(index, 1);
  };
})
.factory('itemsService', function($http){
  var i = {};

  i.items =  function(callback){
      console.log('ehy');
      $http.get('/api/items/listAll').success(callback);
    };

  //Typeahead Query
  i.getItemName = function(query, callback){
      $.getJSON('/api/items/typeahead/term/itemName/query/'+escape(query), function(s) {
          var results = [];
          $.each(s,function(){
            results.push(this.itemName);
          });
          callback(results);
      });
  };
  i.summary = function(id,callback){
      $http.get('/api/items/'+escape(id)+'/options/quick').success(callback);
    };
  i.save =  function(post, callback){
      $http.post('/api/items', {item: post}).success(function(status, response){
        callback(true,response);
      }).
      error(function(status, response){
        callback(false, response);
      });
    };
  i.count =  function(callback){
    $http.get('/api/items/count').
    success(function(data,status){
      callback(data);
    });
  };
  i.saveLocation = function(post,callback){
    $http.post('/api/items/location',post).
    success(function(data, status){
      callback(data);
    });
  };
  i.getPoints = function(callback){
    $http.get('/api/items/location').
    success(function(data, status){
      callback(data);
    });
  };
  i.dispense = function(list, callback){
    $http.post('/api/items/dispense',list).
    success(function(data, status){
      callback(date);
    }).
    error(function(data, status){
      $scope.modal.heading= 'Error Submitting';
      $scope.modal.class= 'md-error';
      $scope.modal.modalState= 'md-show';
      $scope.modal.body = "The last request was not successful. We think something went wrong. Try again. If this error persists, contact Admin";
    });
  };
  //Fetches fields data for an Item
  i.getItemFields = function(itemId, callback){
    $http.get('/api/items/'+escape(itemId)+'/edit').success(callback);
  };
  //Fetches all items for a location
  i.showStockDown = function(location_id, callback){
    $http.get('/api/items/stockdown/'+location_id).success(callback);
  };

  //sends a stockdown request, 
  i.stockdown = function(list, callback){
    $http.post('/api/items/stockdown', list).success(callback);
  };

  //Post updated item fields 
  i.update = function(form, callback){
    $http.post('/api/items/'+escape(form.itemID)+'/edit', form).success(callback);
  };
  return i;
})
.directive('newModal', function(){
    function link($scope, element, attributes){
      element.on('click', function(){
        $(attributes.newModal).modal('toggle');
      });
    }
    return {
      link: link
    };
})
.filter('stockclass',function(){
    return function(cs, bp){
      if(cs === 0){
        return "empty-stock";
      }else if(cs <= bp){
        return "low-stock";
      }else{
        return "good-stock";
      }
    };
  })
.filter('indexclass',function(){
    return function (enabledIndex, index){
      if($.inArray(index, enabledIndex) > -1){
        return "active";
      }else{
        return "inactive";
      }
    };
  });