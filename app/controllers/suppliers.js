
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    Order = mongoose.model('Order'),
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    StockCount = mongoose.model('StockCount'),
    Supplier = mongoose.model('Supplier'),
    _ = require("underscore"),
    utils = require("util");



function SupplierController (){

}

SupplierController.prototype.constructor = Supplier;

/**
 * [add description]
 * @param {[type]}   supplierData [description]
 * @param {Function} callback     [description]
 */
SupplierController.add = function(supplierData, callback){
  if(_.isEmpty(supplierData)){
    return callback(new Error('empty submission'));
  }
  var supplier = new Supplier(supplierData);
  supplier.save(function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [list Gets All the Suppliers]
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
SupplierController.list = function(options, callback){
  Supplier.find({}, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [update updates the supplierData]
 * @param  {[type]}   supplierData [description]
 * @param  {Function} callback     [description]
 * @return {[type]}                [description]
 */
SupplierController.update = function(supplierData, callback){
  var omitted = _.omit(supplierData, "_id");
  Supplier.update({_id: suppplierData._id}, omitted, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
}

/**
 * [one fetches data on a supplier]
 * @param  {[type]}   supplierId [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
SupplierController.one = function(supplierId, callback){
  Supplier.findById(supplierId, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
};

/**
 * [remove remove a supplier]
 * @param  {[type]}   supplier_id [description]
 * @param  {Function} callback    [description]
 * @return {[type]}               [description]
 */
SupplierController.remove= function(supplier_id, callback){
  Supplier.remove({"_id": supplier_id}, function(err, i){
    if(err){
      callback(err);
    }else{
      callback(i);
    }
  });
}

module.exports.routes = function(app){

  app.get('/suppliers', function(req, res){
    res.render('index',{
      title: 'Suppliers'
    });
  });

  app.get('/suppliers/:supplierId/edit', function(req, res){
    res.render('index',{
      title: 'Edit Suppliers'
    });    
  })

  app.get("/api/supplier", function(req, res){
    SupplierController.list({}, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, i);
      }
    });
  });

  app.get("/api/supplier/:supplierId", function(req, res){
    SupplierController.one(req.param.supplierId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, i);
      }
    });
  });

  app.post('/api/supplier', function(req, res, next){
    //return next(new Error('lol'));
    SupplierController.add(req.body, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, {});
      }

    });
  });

  app.put('/api/supplier/:supplierId', function(req, res, next){
    SupplierController.update(req.body, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, {});
      }      
    });
  });

  app.delete('/api/supplier/:supplierId', function(req, res, next){
    SupplierController.remove(req.params.supplierId, function(i){
      if(utils.isError(i)){
        next(i);
      }else{
        res.json(200, {});
      }
    });
  });
};
