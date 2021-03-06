/**
 * Stock Controller Class
 * Module Dependcies
 */
var mongoose = require('mongoose'),
    Item = mongoose.model('Item'),
    Order = mongoose.model('Order'),
    OrderStatus = mongoose.model('OrderStatus'),
    Dispense = mongoose.model('Dispense'),
    Bill = mongoose.model('Bill'),
    PointLocation = mongoose.model('Location'),
    StockHistory = mongoose.model('StockHistory'),
    //StockCount = mongoose.model('StockCount'),
    _ = require("underscore"),
    NafdacDrugs = mongoose.model("nafdacdrug"),
    TransactionModel = mongoose.model('transaction'),
    EventRegister = require('../../lib/event_register').register,    
    util = require("util");


function TransactionController(){
    this.props = null;
}

TransactionController.prototype.constructor = TransactionController;

/**
 * This will start a new transaction session. 
 * This method creates an instance of the transaction
 * model and assigns it to the 'transModel'  property on 
 * TransactionController instrance.
 * 
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
TransactionController.prototype.initiate = function(trans){
    //Holds the new transaction model instaa
    this.transModel = new TransactionModel();
};

/**
* Creates / Saves initial  
 * @param  {[type]} stage [description]
 * @return {[type]}       [description]
 */
TransactionController.prototype.insertRecord = function(request, originLocation, destinationLocation, cb){
    var operation;
    switch(request.action){
    case 'Requested Stock':
        operation = 'add';
        break;
    case 'Dispense':
        operation = 'subtract';
        break;
    case 'Stock Up':
        operation = 'add';
        break;
    default:
        break;
    }
    var self = this;
    self.transModel.origin = (originLocation) ? originLocation.id : undefined;
    self.transModel.destination = (destinationLocation) ? destinationLocation.id : undefined;
    self.transModel.item = request.id;
    self.transModel.operation = operation;
    self.transModel.status = 'initial';
    //The _id on the request object is the ObjectId 
    //for the Stock History just created for this 
    //transaction
    //self.transModel.historyId = request._id;
    self.transModel.amount = request.amount;
    self.transModel.save(function(err, i){

        if(err){
            
            //Should log this.
            cb(err);

        }else{
            //Id like to save the current transaction
            //and some other info into a public property
            self.currentTransaction = {
                origin: originLocation,
                destination: destinationLocation,
                id: i._id
            };
            //delete the trans object
            delete self.transModel;
            cb(self.currentTransaction);
        }
    });
};

TransactionController.prototype.makePending = function(cb){
    var self = this;
    TransactionModel.update({
        _id: this.currentTransaction.id
    },{
        $set:{
            status: 'pending',
            updated: Date.now()
        }
    }, function(err, i){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });
};

TransactionController.prototype.makeCommited = function(cb){
    var self = this;
    TransactionModel.update({
        _id: self.currentTransaction.id
    },{
        $set:{
            status: 'commited',
            updated: Date.now()            
        }
    }, function(err, i){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });
};

TransactionController.prototype.cleanPending = function(dependency, locationId, itemId,  cb){
    var self = this;
    dependency.update({ 
        locationId: locationId,
        item: itemId
    }, {
        $pull: {pendingTransactions: self.currentTransaction.id}
    }, function(err, i){
        if(err){
            cb(err);
        }else{
            cb(true);
        }        
    });

    var pullOrigin = function(){

    }
};

TransactionController.prototype.makeDone = function(cb){
    var self = this;
    TransactionModel.update({
        _id: self.currentTransaction.id
    },{
        $set:{
            status: 'done',
            updated: Date.now()            
        }
    }, function(err, i){
        if(err){
            cb(err);
        }else{
            cb(true);
        }
    });    
};

TransactionController.getTransactions = function(cb){
    var self = this;
    TransactionModel.find()
    .populate('origin')
    .populate('destination')
    .populate('item')
    .exec(function(err, i){
        if(err){
            cb(err);
        }else{
            cb(i);
        }        
    });
};


module.exports.transaction = TransactionController;

module.exports.routes = function(app){
    app.get('/api/transactions', function(req, res, next){
        TransactionController.getTransactions(function(r){
            if(util.isError(r)){
                next(r);
            }else{
                res.json(200, r);
            }
        });
    });
};