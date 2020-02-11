export const myCoordinates = function() {
  const coords = Session.get('myCoordinates');
  
  if(!coords) {
    return null;
  }

  return [ coords.lng, coords.lat ];
}