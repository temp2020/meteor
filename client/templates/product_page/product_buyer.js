import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('BuyerCtrl', BuyerCtrl);

 function BuyerCtrl(
                    $scope,
                    $stateParams,
                    $reactive,
                    $ionicViewSwitcher,
                    $ionicLoading,
                    $ionicSlideBoxDelegate,
                    $ionicPopup,
                    $ionicPopover,
                    $sce,
                    $state,
                    $rootScope,
                    $cordovaToast,
                    $translate,
                    $filter,
                    $window,
                    convertCurrency
                  ) {

  $reactive(this).attach($scope);
  var self = this;
  this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';
  this.language = window.localStorage.getItem('language') || 'en';
  
  $ionicPopover.fromTemplateUrl('client/templates/nav-links/details.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.links = popover;
  });

  this.subscribe('productBuyer', () => [ $stateParams.listingId ], {
    onReady: function() {
        let post = Listings.findOne({ _id: $stateParams.listingId })
        self.subscribe('product', () => [ post.productID ], {
          onReady: function() {
            return;
          }
        });
      $ionicSlideBoxDelegate.update();
      $ionicLoading.hide();
    }
  });

  this.helpers({
    listing: () => Listings.findOne({ _id: $stateParams.listingId }),
    product: () => Products.findOne({ _id: self.getReactively('listing.productID') }),
    postOffer: () => Offers.findOne({ listingID: $stateParams.listingId }, { sort: { offerAmount: -1, offerDate: 1 }}),
    offerCount: () => Offers.find({ listingID: $stateParams.listingId }).count(),
    hasOffer: () => Offers.find({ listingID: $stateParams.listingId, offerBy: Meteor.userId() }).count(),
    following: () => Follows.findOne({ listingId: $stateParams.listingId, userId: Meteor.userId() }),
    isCustomer: () => Favorites.findOne({ 
      storeId: self.getReactively('listing.storeId'),
      userId: Meteor.userId()
    }),
    userId: () => Meteor.userId()
  });

  this.follow = function(){
    if( !self.userId ){
      $state.go('app.login');
      return;
    }

    self.call('followListing', $stateParams.listingId, function(err){
      if(err){
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });
        return;
      }
    });
  }
 
  this.favorite = function() {
    if( !self.userId ){
      $state.go('app.login');
      return;
    }

    if (!self.listing.storeId) {
      return;
    }

    self.call('favoriteStore', self.listing.storeId, function(err){
      if(err){
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });
        return;
      }
    });
  }

  //Get uploaded images from database.
  this.uploads = function(imgId) {
    let upload = Uploads.findOne({ _id: imgId });
    if ( upload ) {
      return upload.link();
    } else {
      return;
    }
  };

  //Get profile of seller of this listing.
  this.seller = function(id) {
    return Profile.findOne({ profID: id });
  };

  //Get profile image of seller of this listing.
  this.sellerImg = function(id) {
    return ProfileImg.findOne({ 'meta.userId': id });
  };

  //Render listing description as HTML.
  this.notes = function(notes) {
    return $sce.trustAsHtml(notes);
  };

  //Image slider funciton.
  this.slideChanged = function(index) {
    $scope.slideIndex = index;
  };

  this.setOfferCount = function(count){
    if(!count || count === 0){
      return '';
    }
    else if ( count === 1) {
      return 'LABEL.OFFER';
    }
    else{
      return 'LABEL.OFFERS';
    }
  }

  this.priceAmount = function(price, currency){
    if(!price || !currency){
      return;
    }

    return convertCurrency(price, currency, this.baseCurrency);
  } 

  //Load chat with seller.
  this.buyNow = function() {
    if ( Meteor.userId() ) {
      $rootScope.$broadcast('loadspinner');

      //Check for existing chat with same user on same listing.
      let chatCheck = ChatRoom.find({
                        listingID: self.listing._id,
                        sellerActive: true
                      }).count();
      if ( chatCheck != 0 ) {
        let goChat =  ChatRoom.findOne({
                        listingID: self.listing._id,
                        sellerActive: true
                      });
        $state.go('app.chat', { chatId: goChat._id });
      }
      else {
        var prod = self.listing.title;

        //Save chat details to object.
        let newChat = {
              listingID: self.listing._id,
              prodName: prod,
              offerID: null
        }

        //Create new chat room.
        //Method is located at tapshop/server/methods/messages_server.js
        self.call('loadChat', newChat, 'buy now', function(err, chatid) {
          if (!err) {

            //Method is located at tapshop/server/methods/messages_server.js
            self.call('systemMsg', 'Buy', chatid);
            
            self.call('sendMoreDetails', { listingId: self.listing._id, chatId: chatid });

            $state.go('app.chat', { chatId: chatid });
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
      }
    }
    else {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.login');
    }
  };

  //Load popup to send offer to seller.
  this.newOffer = function() {
    if ( Meteor.userId() ) {
      $translate([
        'LABEL.ENTER_OFFER',
        'LABEL.CANCEL',
        'LABEL.SEND',
        'MESSAGE.TOAST.OFFER_SENT',
        'MESSAGE.TOAST.TRY_AGAIN',
        'LAYOUT.STYLE'
      ]).then(function (result) {

        let thisPost = self.listing;

        self.myPopup = $ionicPopup.show({
          template: '<input type="tel" ng-model="vm.offer" autofocus>',
          cssClass: result['LAYOUT.STYLE'],
          title: result['LABEL.ENTER_OFFER'],
          scope: $scope,
          buttons: [{
            text: result['LABEL.CANCEL']
          },{
            text: '<b id="send-offer">' + result['LABEL.SEND'] + '</b>',
            type: 'button-positive',
            onTap: function(e) {
              if ( $scope.vm.offer && $scope.vm.offer > 0 ) {

                let sendOffer = {
                  listingID: thisPost._id,
                  offerAmount: parseInt( $scope.vm.offer.replace(/,/g, '') ),
                  currency: self.baseCurrency
                }
                //Method is located at tapshop/lib/methods/offers.js
                Meteor.call('newOffer', sendOffer, thisPost.productID, function(err){
                  if (!err) {
                    if (Meteor.isCordova) {
                      $cordovaToast.showShortBottom( result['MESSAGE.TOAST.OFFER_SENT'] );
                    }
                    else {
                      toastr.success( result['MESSAGE.TOAST.OFFER_SENT'] );
                    }
                    //Method is located at tapshop/server/methods/feed_server.js
                    Meteor.call('insertFeed', 'newOffer', thisPost.listedBy, thisPost.title, thisPost._id );
                  }
                  else {
                    if (Meteor.isCordova) {
                      $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    }
                    else {
                      toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    }
                  }
                });
              }
              else {
                e.preventDefault();
              }
            }
          }]
        });
      });
    }
    else {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.login');
    }
  };

  //Load popup to change or remove current offer to seller.
  this.changeOffer = function() {
    if ( Meteor.userId() ) {
      $translate([
        'LABEL.CHANGE_OFFER_CONFIRM',
        'LABEL.BACK',
        'LABEL.SEND',
        'MESSAGE.TOAST.OFFER_REMOVED',
        'MESSAGE.TOAST.OFFER_UPDATED',
        'MESSAGE.TOAST.TRY_AGAIN',
        'LAYOUT.STYLE'
      ]).then(function (result) {

        let thisPost = self.listing;
        self.myOffer = Offers.findOne({ listingID: self.listing._id, offerBy: Meteor.userId() });

        self.myPopup = $ionicPopup.show({
          template: '<input type="tel" ng-model="vm.myOffer.offerAmount" autofocus>',
          cssClass: result['LAYOUT.STYLE'],
          title: result['LABEL.CHANGE_OFFER_CONFIRM'],
          scope: $scope,
          buttons: [{
            text: '<i class="far fa-trash-alt fa-lg"></i>',
            type: 'button-assertive',
            onTap: function(e) {

              //Method is located at tapshop/lib/methods/offers.js
              Meteor.call('removeOffers', self.myOffer._id, thisPost._id, thisPost.productID, function(err) {
                if (!err) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showShortBottom( result['MESSAGE.TOAST.OFFER_REMOVED'] );
                  }
                  else {
                    toastr.success( result['MESSAGE.TOAST.OFFER_REMOVED'] );
                  }
                }
                else {
                  if (Meteor.isCordova) {
                    $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                  }
                  else {
                    toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                  }
                }
              });
            }
          },{
            text: result['LABEL.BACK']
          },{
            text: '<b id="send-offer">' + result['LABEL.SEND'] + '</b>',
            type: 'button-positive',
            onTap: function(e) {
              if ( self.myOffer.offerAmount && self.myOffer.offerAmount > 0 ) {

                //Method is located at tapshop/lib/methods/offers.js
                Meteor.call('changeOffer', self.myOffer._id, parseInt( self.myOffer.offerAmount.replace(/,/g, '') ), self.baseCurrency, function(err){
                  if (!err) {
                    if (Meteor.isCordova) {
                      $cordovaToast.showShortBottom( result['MESSAGE.TOAST.OFFER_UPDATED'] );
                    }
                    else {
                      toastr.success( result['MESSAGE.TOAST.OFFER_UPDATED'] );
                    }

                    //Method is located at tapshop/server/methods/feed_server.js
                    Meteor.call('insertFeed', 'changeOffer', thisPost.listedBy, thisPost.title, thisPost._id );
                  }
                  else {
                    if (Meteor.isCordova) {
                      $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    }
                    else {
                      toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                    }
                  }
                });
              }
              else {
                e.preventDefault();
              }
            }
          }]
        });
      });
    }
    else {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.login');
    }
  };

  this.isSeller = $state.is('app.myproduct');

  //Refresh data function.
  $scope.refresh = function() {
    $ionicSlideBoxDelegate.update();
    $state.reload('app.product');
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    if( self.myPopup  ){
      self.myPopup.close();
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    //Add to view count of this listing.
    //Method is located at tapshop/lib/methods/listings.js
    Meteor.call('addView', $stateParams.listingId);
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
