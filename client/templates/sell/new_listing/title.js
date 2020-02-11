import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostTitleCtrl', NewPostTitleCtrl);

function NewPostTitleCtrl (
  $scope,
  $state,
  $reactive,
  $ionicLoading,
  $ionicPlatform,
  $ionicHistory,
  $ionicViewSwitcher,
  $translate,
  newListing
){

  $reactive(this).attach($scope);
  const self = this;
  this.language = $translate.use() ||'en';
  this.title = newListing.getListingData('title');

  this.next = function() {
    
    if( !self.title ) {
      
      $translate('MESSAGE.TOAST.FIELD_REQUIRED').then(function (message) {

        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.error(message);
        }

      });

      return;
    }

    self.title = self.title.trim().toString();

    newListing.addField('title', self.title);

    $state.go('app.new-post-condition');
  }

  $ionicPlatform.onHardwareBackButton( function(){
    if ( $ionicHistory.backView() === null ) {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.sell');
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
