export const canEdit = function(firstPublishDate) {
  
  const oneHour = 3600000 * 1;

  const timePublished = Date.now() - firstPublishDate.getTime();
  
  return timePublished >= oneHour;
}