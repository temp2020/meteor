import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import Autolinker from 'autolinker';

angular
  .module('salephone')
  .controller('MsgCtrl', MsgCtrl);

function MsgCtrl (
                  $scope,
                  $reactive,
                  $sce,
                  $cordovaToast,
                  $state,
                  $stateParams,
                  $ionicLoading,
                  $ionicScrollDelegate,
                  $timeout,
                  $translate,
                  $window,
                  convertCurrency
                  ) {

  $reactive(this).attach($scope);
  var self = this;
  this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

  this.subscribe('chatMsg', () => [ $stateParams.chatId ], {
    onReady: function() {
      return;
    }
  });

  this.subscribe('thisChat', () => [ $stateParams.chatId ], {
    onReady: function() {
      if( !ChatRoom.findOne({ _id: $stateParams.chatId }) ) {
        $state.go('app.chatlist');
      }
      return;
    }
  });

  this.helpers({
    thisUser: () => Meteor.userId(),
    messages: () => Messages.find({ chatID: $stateParams.chatId },{ sort: { sent: 1 } }),
    chat: () => ChatRoom.findOne({ _id: $stateParams.chatId }),
    otherUser: () => Profile.findOne({
        $and: [{
          profID: { $ne: Meteor.userId() }
        },{
          $or:[{
            profID: self.getReactively('chat.buyer')
          },{
            profID: self.getReactively('chat.seller')
          }]
        }]
    })
  });
  
  this.priceAmount = function(price, currency){
    if(!price || !currency){
      return;
    }

    return convertCurrency(price, currency, this.baseCurrency);
  } 

  //Get messages and render as HTML. Set message as read.
  this.chatmsg = function(id) {
    
    if ( Messages.findOne({ _id: id }) ) {
      //Method is located at tapshop/lib/methods/messages.js
      Meteor.call('setRead', id);
      return $sce.trustAsHtml( Messages.findOne({ _id: id }).body );
    } else {
      return;
    }
  };

  this.systemRead = function(id){
    if ( Messages.findOne({ _id: id }) ) {
      Meteor.call('setRead', id);
      return;
    }
    else{
      return;
    }
  }

  //Send a new message.
  this.sendMsg = function() {
    if ( self.chat.buyerActive === true && self.chat.sellerActive === true ) {
      if ( this.body ){
        let newmsg = {
          chatID: self.chat._id,
          body: Autolinker.link( this.body.toString().replace(/(?:\r\n|\r|\n)/g, '<br />') )
        };
        //Method is located at tapshop/lib/methods/messages.js
        Meteor.call('newMsg', newmsg, function(err) {
          if (!err) {
            console.log('Message sent.');
            if (Meteor.isCordova) {
              cordova.plugins.Keyboard.close();
            } else {
              document.getElementById("chatInput").blur();
            }
          }
          else {
        
            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
                cordova.plugins.Keyboard.close();
              } 
              else {
                toastr.error(message);
                document.getElementById("chatInput").blur();
              }
            });

          }
        });
      }
      this.body = '';
    }
    else {

      $translate('MESSAGE.TOAST.OTHER_USER_LEFT').then(function (message) {
        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
          cordova.plugins.Keyboard.close();
        } 
        else {
          toastr.error(message);
          document.getElementById("chatInput").blur();
        }
      });
      
      this.body = '';
    }
  };

  //Auto scroll down to the last message.
  this.showMsg = function(isLast) {
    if (isLast === true) {
      $ionicScrollDelegate.scrollBottom();
      return;
    } else {
      return;
    }
  }

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    $ionicLoading.hide();
  });

};
