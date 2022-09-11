function formatDate(strDate){
  return new Date(strDate)
  .toDateString()
  .split(" ")
  .splice(1, 3)
  .map((str, i)=> i === 1 ? str+"," : str)
  .join(" ");
}


module.exports = formatDate;