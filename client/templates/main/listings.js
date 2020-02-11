import { _meteorAngular } from 'meteor/angular';

angular
    .module('salephone')
    .directive('listings', function (){
      return {
        restrict: 'E',
        templateUrl: 'client/templates/main/listings.html',
        controller: function($scope, $filter){

          $scope.priceAmount = function(price){
            if(!price){
              return;
            }
            return $filter('number')(price, 0);
          }

          $scope.offerAmount = function(id){
            let offer = Offers.findOne({
                  listingID: id
                },{
                  sort: {
                    offerAmount: -1,
                    offerDate: 1
                  }
            });
            
            if ( offer ) {
              return  $filter('number')(offer.offerAmount, 0);
            }
            else {
              return false;
            }                        
          }          

        }
      }
    });
