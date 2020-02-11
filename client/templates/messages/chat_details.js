import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';

angular
  .module('salephone')
  .controller('MsgInfoCtrl', MsgInfoCtrl);

function MsgInfoCtrl (
                  $scope,
                  $reactive,
                  $cordovaToast,
                  $state,
                  $stateParams,
                  $ionicPopup,
                  $ionicLoading,
                  $ionicModal,
                  $rootScope,
                  $translate,
                  $window,
                  convertCurrency,
                  $ionicViewSwitcher
                  ) {

  $reactive(this).attach($scope);
  var self = this;
  this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

  this.subscribe('chatDetails', () => [ $stateParams.chatId ], {
    onReady: function() {
      $ionicLoading.hide();
      return;
    }
  });

  this.helpers({
    chat: () => ChatRoom.findOne({ _id: $stateParams.chatId }),
    listing: () => Listings.findOne({ _id: self.getReactively('chat.listingID') }),
    uploadImg: () => Uploads.findOne({ 'meta.listID': self.getReactively('chat.listingID') }),
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
    }),
    userImg: () => ProfileImg.findOne({
      $and: [{
        'meta.userId': { $ne: Meteor.userId() }
      },{
        $or:[{
          'meta.userId': self.getReactively('chat.buyer')
        },{
          'meta.userId': self.getReactively('chat.seller')
        }]
      }]
    }),
    thisUser: () => Meteor.userId()
  });

  //Get count of all messages in this chat.
  //Method is located at tapshop/lib/methods/app_methods.js
  Meteor.call('allMsg', $stateParams.chatId, function(err, result){
    self.msgCount = result;
  })
  self.rating = null;

  this.priceAmount = function(price, currency){
    if(!price || !currency){
      return;
    }

    return convertCurrency(price, currency, this.baseCurrency);
  } 

  //Modal for user feedback.
  $ionicModal.fromTemplateUrl('client/templates/messages/components/feedback_modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  //Function for user to cancel and leave chat.
  this.cancel = function() {

      $translate([
        'LABEL.LEAVE',
        'LABEL.LEAVE_CONFIRM',
        'LABEL.YES',
        'LABEL.NO',
        'LAYOUT.STYLE'
      ]).then(function (result) {
        self.cancelPopup = $ionicPopup.confirm({
          title: result['LABEL.LEAVE'],
          cssClass: result['LAYOUT.STYLE'],
          template: result['LABEL.LEAVE_CONFIRM'],
          scope: $scope,
          buttons: [{
            text: result['LABEL.NO']
          },{
            text: '<b>' + result['LABEL.YES'] + '</b>',
            type: 'button-assertive',
            onTap: function() {
              //Let user rate the other user.
              if ( self.msgCount >= 4 ) {
                $scope.modal.show();
              }
              else {
                return self.removeChat();
              }
            }
          }]
        });
      });
  }

  this.removeChat = function() {
    $rootScope.$broadcast('loadspinner');

    //Remove offers of this user.
    if ( Offers.find({ offerBy: self.chat.buyer }).count() != 0 ) {
      let thisoffer = Offers.findOne({ offerBy: self.chat.buyer });

      //Method is located at tapshop/lib/methods/offers.js
      Meteor.call( 'removeOffers', thisoffer._id, self.listing._id, self.listing.productID );
    };

    if ( Meteor.userId() === self.chat.buyer ) {

      if ( self.chat.sellerActive === true ) {
        //Method is located at tapshop/server/methods/messages_server.js
        Meteor.call('systemMsg', 'CancelBuyer', self.chat._id);
      }

      //Method is located at tapshop/lib/methods/messages.js
      Meteor.call('cancelBuyer', self.chat._id, function(err) {
        if (!err) {

          $translate('MESSAGE.TOAST.LEFT_CHAT').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showShortBottom(message);
            }
            else {
              toastr.success(message);
            }
          });
          $ionicViewSwitcher.nextDirection("back");
          $state.go('app.sell');
        }
        else {
          $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          $ionicLoading.hide();
        }
      });
    }
    else if ( Meteor.userId() === self.chat.seller ) {

      if ( self.chat.buyerActive === true ) {
        //Method is located at tapshop/server/methods/messages_server.js
        Meteor.call('systemMsg', 'CancelSeller', self.chat._id);
      }

      //Method is located at tapshop/lib/methods/messages.js
      Meteor.call('cancelSeller', self.chat._id, function(err) {
          if (!err) {

            $translate('MESSAGE.TOAST.CHAT_REMOVED').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showShortBottom(message);
              }
              else {
                toastr.success(message);
              }
            });
            $ionicViewSwitcher.nextDirection("back");
            $state.go('app.sell');
          }
          else {
            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });

            $ionicLoading.hide();
          }
      });
    }
  }

  //Set the listing as sold and remove from public view.
  this.itemSold = function() {
      $translate([
        'LABEL.CONFIRM_SOLD',
        'LABEL.ITEM_SOLD_CONFIRM',
        'LABEL.YES',
        'LABEL.NO',
        'MESSAGE.TOAST.PRODUCT_SOLD',
        'MESSAGE.TOAST.TRY_AGAIN',
        'LAYOUT.STYLE'
      ]).then(function (result) {

        self.soldPopup = $ionicPopup.confirm({
          title: result['LABEL.CONFIRM_SOLD'],
          cssClass: result['LAYOUT.STYLE'],
          template: result['LABEL.ITEM_SOLD_CONFIRM'],
          scope: $scope,
          buttons: [{
            text: result['LABEL.NO']
          },{
            text: '<b>' + result['LABEL.YES'] + '</b>',
            type: 'button-assertive',
            onTap: function() {
              $rootScope.$broadcast('loadspinner');
              if ( Meteor.userId() === self.chat.seller ) {

              //Method is located at tapshop/lib/methods/listings.js
                Meteor.call('soldListing', self.listing._id, self.chat._id, function(err){
                  if (!err) {
                    //Method is located at tapshop/server/methods/messages_server.js
                    Meteor.call('systemMsg', 'Sold', self.chat._id);
                      if (Meteor.isCordova) {
                        $cordovaToast.showShortBottom( result['MESSAGE.TOAST.PRODUCT_SOLD'] );
                      }
                      else {
                        toastr.success( result['MESSAGE.TOAST.PRODUCT_SOLD'] );
                      }
                      $state.go('app.chat', { chatId: $stateParams.chatId });
                  }
                  else {
                    if (Meteor.isCordova) {
                      $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    } else {
                      toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    }
                    $ionicLoading.hide();
                  }
                });
              }
            }
          }]
        });

      });
  }

  //Go to product page of listing.
  this.goListing = function() {
    if ( Listings.findOne({ _id: self.chat.listingID, active: true }) ) {
      if ( self.listing.listedBy === Meteor.userId() ) {
        $state.go('app.myproduct', { listingId: self.listing._id });
      }
      else {
        $state.go('app.product', { listingId: self.listing._id });
      }
    } else {
      return;
    }
  }

  //Skip user rating.
  this.skip = function() {
    return self.removeChat();
  }

  //Save rating of other user.
  this.rate = function() {
    $rootScope.$broadcast('loadspinner');
    if ( self.feedback ) {
      var feedback = self.feedback.toString().replace(/(?:\r\n|\r|\n)/g, '<br />');
    } else {
      var feedback = '';
    }

    let thisFeedback = {
          chatID: self.chat._id,
          goodRating: self.rating,
          body: feedback
        };
    //Method is located at tapshop/server/methods/feedback_server.js
    Meteor.call('sendFeedback', thisFeedback, function(err) {
      if (!err) {

        //Method is located at tapshop/server/methods/feed_server.js
        Meteor.call('insertFeed', 'postFeedback', self.otherUser.profID, null, self.otherUser.profID);

        $translate('MESSAGE.TOAST.RATING_SENT').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showShortBottom(message);
          }
          else {
            toastr.success(message);
          }
        });

        return self.removeChat();
      }
      else {

        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });

        $ionicLoading.hide();
        return;
      }
    });
  };

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    $scope.modal.remove();
    
    if( self.cancelPopup ){
      self.cancelPopup.close();
    }

    if( self.soldPopup ){
       self.soldPopup.close();
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });

};
