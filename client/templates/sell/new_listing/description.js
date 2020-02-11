angular
    .module('salephone')
    .controller('NewPostDescriptionCtrl', NewPostDescriptionCtrl);

function NewPostDescriptionCtrl (
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
  this.notes;
  this.publishPopup;

  this.loadDescription = function() {
    const notes = newListing.getListingData('listingNotes');

    if(!notes) {
      return;
    }

    self.notes = notes.replace(/<br\s*[\/]?>/g, "\n");
  }

  this.loadDescription();

  this.addField = function() {
    if( self.notes ) {
        
      const notes = self.notes.toString().replace(/(?:\r\n|\r|\n)/g, '<br />');

      newListing.addField('listingNotes', notes);
    }

    return;
  }

  this.next = function() {
    
    self.addField();

    $state.go('app.new-post-details');
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
