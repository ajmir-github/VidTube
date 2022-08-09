const {
  serilizeSpecialChar
} = require("./libs/serilizeSpecialChar");


const sentence = "I love C++.";
const word = serilizeSpecialChar("C++");

const pattern = new RegExp("c\+\+", "ig");
const found = pattern.test(word);


console.log({
  sentence,
  word,
  pattern,
  found
})

