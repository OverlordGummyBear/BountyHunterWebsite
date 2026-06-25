import express from "express"
import bodyParser from "body-parser";
import axios from "axios"

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

//Search for specific wanted posters
app.post("/search", async (req, res) => {
    const { name, species, type, gender, status } = req.body;
    const filterCategories = {name, species, type, gender, status}; //Make categories an object so Object.entries can handle it
    let query = "";

    for(const [key, value] of Object.entries(filterCategories)){ //get a key and value for each category
        if(value)
            query += key + "=" + value + "&";
    }

    if(query.substring(query.length-1) == "&") query = query.substring(0, query.length-1) //remove & at the end of query
    query = query.toLowerCase(); //all queries should be lower case

    const page = req.body.page || 1;

    try{
        //const response = await axios.get(`https://rickandmortyapi.com/api/character/?page=${page}&` + query);
        const response = await fetchWithRetry(page, query);
        console.log(response.data.info);
        res.render("posterList.ejs", { //info needed for pagination
                data: response.data, 
                pages: response.data.info.pages, 
                currentPage: page,
                filters: {name, species, type, gender, status}
            });
    } catch(error) {
        console.error("Failed to make request: " + error.message);
        res.render("posterList.ejs", {error: error.message});
    }
});

//Get a wanted poster of specific character
app.get("/character/:id", async (req,res) => {
    const id = req.params.id; //capture id from the href

    try{
        const response = await axios.get(`https://rickandmortyapi.com/api/character/${id}`)
        res.render("wantedPoster.ejs", { data: response.data} ); //send the character data and render the index.ejs file
    } catch(error){
        console.error("Failed to make request:", error.message);
        res.status(500);
    }
});

//Get random wanted poster
app.get("/random", async (req, res) => {
    try{
        //Figure out how many characters are in total
        const response = await axios.get("https://rickandmortyapi.com/api/character");
        const totalCharacters = response.data.info.count;
  
        //Choose a random character (there is no random character endpoint)
        const characterId = Math.floor(Math.random() * totalCharacters); 
        console.log("CharacterId: " + characterId)

        //Get a random character
        const characterResponse = await axios.get(`https://rickandmortyapi.com/api/character/${characterId}`);
        res.render("wantedPoster.ejs", { data: characterResponse.data} ); //send the character data and render the index.ejs file

    } catch(error){
        console.error("Failed to make request:", error.message);
        res.status(500);
    }
});

//axios retry function
async function fetchWithRetry(page, query) {
    try {
        const response = await axios.get(`https://rickandmortyapi.com/api/character/?page=${page}&` + query);
        return response;
    } catch(error) {
        if(error.status === 429) { //if 429 (too many request) then try again after a delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(page, query); // retry with same arguments
        }
        throw error;
    }
}


app.listen(port, () => {
    console.log(`Server running on ${port}`);
});