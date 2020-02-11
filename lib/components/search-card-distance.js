export const searchCardDistance = function(userId) {
  
  let defaultDistance = 50;

  if(!userId) {
    return defaultDistance;
  }

  const searchCard = UserSearchCards.findOne({ userId });
  
  if(!searchCard) {
    return defaultDistance;
  }
  
  if ( !searchCard.name || isExpired(searchCard.expiry) ) {
    return defaultDistance;
  }
  
  return searchCard.distance;
}

function isExpired (expiry) {
  return expiry !== null && new Date() >= expiry
}