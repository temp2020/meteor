angular
    .module('salephone')
    .controller('NewPostDetailsCtrl', NewPostDetailsCtrl);

function NewPostDetailsCtrl (
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
  this.details;

  this.loadDescription = function() {
    const details = newListing.getListingData('moreDetails');

    if(!details) {
      return;
    }

    self.details = details.replace(/<br\s*[\/]?>/g, "\n");
  }

  this.loadDescription();

  this.addField = function() {
    if( self.details ) {
        
      const details = self.details.toString().replace(/(?:\r\n|\r|\n)/g, '<br />');

      newListing.addField('moreDetails', details);
    }
    return;
  }

  this.next = function() {
    
    self.addField();

    $state.go('app.new-post-meet-location');
  }

  this.saveCallback = function(err) {
    if(err) {
      return;
    }

    $state.go('app.sell');
  }

  this.save = function(isPublished) {
    
    self.addField();

    if(isPublished) {
      self.publishPopup = newListing.publishListing(self.saveCallback);
      return;
    }

    newListing.saveListing(false, self.saveCallback);
  }

  this.cancel = function() {
    newListing.init();
      
    $ionicViewSwitcher.nextDirection("back");

    $state.go('app.sell');
  }

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    if(self.publishPopup) {
      self.publishPopup.close();
    }
  });

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
