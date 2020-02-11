import { _meteorAngular } from 'meteor/angular';
import moment from 'moment';

angular
  .module('salephone')
  .filter('expiryDate', expiryDate);

function expiryDate () {
  return function (time) {
    if (!time) return;
    
    return moment(time).format("MMM D, h:mm a"); 
    
    /*
    moment(time).calendar(null, {
        sameDay : '[Today], LT',
        nextDay: '[Tomorrow], LT',
        nextWeek: 'MMM d, LT',     
        sameElse : 'MMM d, LT'
    });
    */
  };
}
