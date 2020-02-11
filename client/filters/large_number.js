import { _meteorAngular } from 'meteor/angular';

angular
  .module('salephone')
  .filter('largeNumber', largeNumber);

function largeNumber () {
    return (number, fractionSize) => {

        if(number === null) return null;
        if(number === 0) return "0";

        if(!fractionSize || fractionSize < 0)
            fractionSize = 1;

        let abs = Math.abs(number);
        
        const rounder = Math.pow(10,fractionSize);
        
        const isNegative = number < 0;
        
        let key = '';

        const powers = [
            {key: "Q", value: Math.pow(10,15)},
            {key: "T", value: Math.pow(10,12)},
            {key: "B", value: Math.pow(10,9)},
            {key: "M", value: Math.pow(10,6)}
        ];

        for(var i = 0; i < powers.length; i++) {

            var reduced = abs / powers[i].value;

            reduced = Math.round(reduced * rounder) / rounder;

            if(reduced >= 1){
                abs = reduced;
                key = powers[i].key;
                break;
            }
        }

        abs = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        return (isNegative ? '-' : '') + abs + key;
    };
};

