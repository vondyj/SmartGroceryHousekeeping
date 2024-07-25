require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

const pool = new Pool({
  max: 5,
  idleTimeoutMillis: 50000,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
})


app.use(bodyParser.json());

app.get('/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.post('/api/add-item', async (req, res) => {
  const { iname, unit, quantity, ripeRating, barcode, itemDescription, recipeId } = req.body; 

  try {
    const itemResult = await pool.query(
      'SELECT itemId FROM Items WHERE itemName = $1 OR itemName = $2',
      [iname, barcode]
    );

    let itemId;

    if (itemResult.rows.length > 0) {
      // Item exists
      itemId = itemResult.rows[0].itemid;
    } else {
      // Insert new item
      const insertItemResult = await pool.query(
        'INSERT INTO Items (itemName, itemDescription) VALUES ($1, $2) RETURNING itemId',
        [iname, itemDescription] 
      );
      itemId = insertItemResult.rows[0].itemid;
    }
    res.status(200).json({ message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error); 
    res.status(500).json({ message: 'Error adding item', error: error.message });
  }
});

app.post('/api/add-item', async (req, res) => {
  const { iname, unit, quantity, ripeRating, barcode, itemDescription, recipeId } = req.body; 

  try {
    const itemResult = await pool.query(
      'SELECT itemId FROM Items WHERE itemName = $1 OR itemName = $2',
      [iname, barcode]
    );

    let itemId;

    if (itemResult.rows.length > 0) {
      // Item exists
      itemId = itemResult.rows[0].itemid;
    } else {
      // Insert new item
      const insertItemResult = await pool.query(
        'INSERT INTO Items (itemName, itemDescription) VALUES ($1, $2) RETURNING itemId',
        [iname, itemDescription] 
      );
      itemId = insertItemResult.rows[0].itemid;
    }
    res.status(200).json({ message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error); 
    res.status(500).json({ message: 'Error adding item', error: error.message });
  }
});

//----------------------------------------------------------------------------
//                View Recipe Page requests
//----------------------------------------------------------------------------

//Get recipe name and description From recipeid
app.get('/api/recipes/:recipeId/namedescription', async(req,res) => {
  try{
    const getRecipeInfoData = await pool.query(
      `SELECT
        recipeName,
        recipeDescription
      FROM recipes
      WHERE recipeId = ${req.params.recipeId}`
    );
    res.json(getRecipeInfoData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//Get recipe ingredients from recipeid
app.get('/api/recipes/:recipeId/ingredients', async(req,res) => {
  try{
    const getRecipeIngredientData = await pool.query(
      `SELECT 
        I.itemName, 
        IR.quantity,
        IR.quantityunit
      FROM Items AS I
      INNER JOIN ItemsRecipes AS IR ON IR.FK_items_itemId = I.itemId
      INNER JOIN Recipes AS R ON IR.FK_recipes_recipeId = R.recipeId
      WHERE R.recipeId = ${req.params.recipeId}`
    );
    res.json(getRecipeIngredientData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//verify recipeid exists
app.get('/api/recipes/:recipeId/verify', async(req,res) => {
  try{
    const getRecipeVerify = await pool.query(
    `SELECT recipeId FROM recipes where recipeid = ${req.params.recipeId}`
    );
    if (getRecipeVerify.rows.length === 0 ) {
      res.status(404).send("404 recipeId doesn't exist");
    }
    else {res.status(200).send("recipe exists")}
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//get recipe steps from recipeid
app.get('/api/recipes/:recipeId/steps', async(req,res) => {
  try{
    const getRecipeStepData = await pool.query(

    `SELECT
      S.StepNumber,
      S.stepDescription
    FROM Recipes AS R
    INNER JOIN RecipesSteps AS RS ON RS.FK_recipes_recipeId = R.recipeId
    INNER JOIN Steps AS S ON RS.FK_steps_stepId = S.stepId
    WHERE R.recipeId = ${req.params.recipeId}
    ORDER BY S.stepNumber ASC;
  `
    );
    res.json(getRecipeStepData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//----------------------------------------------------------------------------
//                Dashboard Page requests
//----------------------------------------------------------------------------

// get items spoiling soon
app.get('/dashboard/:userId/spoilingsoon', async(req, res) => {
  
  try{
    const getUserSpoilingSoon = await pool.query(
      `SELECT 
        users.userid as "id",
        items.itemname as "itemName",
        usersitems.quantityremaining as "itemQuantity",
        usersitems.spoilagedate as "spoilDate",
        current_date as "today",
        images.imagefilepath as "imagePath",
        units.unitname as "itemUnit",
        usersitems.spoiled as "isSpoiled"
      FROM users
      INNER JOIN usersitems ON users.userid = usersitems.fk_users_userid
      INNER JOIN items ON usersitems.fk_items_itemid = items.itemid
      INNER JOIN itemsimages ON items.itemid = itemsimages.fk_items_itemid
      INNER JOIN images ON itemsimages.fk_images_imageid = images.imageid
      INNER JOIN itemsunits ON items.itemid = itemsunits.fk_items_itemid
      INNER JOIN units ON itemsunits.fk_units_unitid = units.unitid
      WHERE users.userid = ${req.params.userId}
      AND (usersitems.spoilagedate <= (current_date + 5) AND usersitems.spoiled = False);`);

    res.json(getUserSpoilingSoon.rows)
    
  }catch (err){
    console.error(err);
    res.status(500).send('Server error');
  }
})


// get items recently purchased
app.get('/dashboard/:userId/recentitems', async(req, res) => {
  
  try{
    const getUserRecentItems = await pool.query(
      `SELECT 
        users.userid as "id",
        items.itemname as "itemName",
        usersitems.quantityremaining as "itemQuantity",
        current_date as "today",
        usersitems.dateadded as "dateAdded",
        images.imagefilepath as "imagePath",
        units.unitname as "itemUnit"
      FROM users
      INNER JOIN usersitems ON users.userid = usersitems.fk_users_userid
      INNER JOIN items ON usersitems.fk_items_itemid = items.itemid
      INNER JOIN itemsimages ON items.itemid = itemsimages.fk_items_itemid
      INNER JOIN images ON itemsimages.fk_images_imageid = images.imageid
      INNER JOIN itemsunits ON items.itemid = itemsunits.fk_items_itemid
      INNER JOIN units ON itemsunits.fk_units_unitid = units.unitid
      WHERE users.userid = 1
	    AND usersitems.dateadded >= (current_date - 5)
	    ORDER BY usersitems.dateadded DESC;`);

    res.json(getUserRecentItems.rows)
    
  }catch (err){
    console.error(err);
    res.status(500).send('Server error');
  }
})

// get all items
app.get('/dashboard/:userId/allitems', async(req, res) => {
  
  try{
    const getAllUserItems = await pool.query(
      `SELECT users.userid as "id", 
            items.itemname as "itemName", 
            usersitems.quantityremaining as "itemQuantity", 
            images.imagefilepath as "imagePath", 
            units.unitname as "itemUnit" 
      FROM users
      INNER JOIN usersitems ON users.userid = usersitems.fk_users_userid 
      INNER JOIN items ON usersitems.fk_items_itemid = items.itemid 
      INNER JOIN itemsimages ON items.itemid = itemsimages.fk_items_itemid 
      INNER JOIN images ON itemsimages.fk_images_imageid = images.imageid 
      INNER JOIN itemsunits ON items.itemid = itemsunits.fk_items_itemid 
      INNER JOIN units ON itemsunits.fk_units_unitid = units.unitid 
      WHERE users.userid = ${req.params.userId};`
    );
    res.json(getAllUserItems.rows)
    
  }catch (err){
    console.error(err);
    res.status(500).send('Server error');
  }

})


//----------------------------------------------------------------------------
//                Recipes Page requests
//----------------------------------------------------------------------------

//Get all ingredients spoiling in the next 5 days
app.get('/api/users/:userid/ingredients/spoilsoon', async(req,res) => {
  try{
    const getSpoilSoonIngredientsData = await pool.query(
      `SELECT
	      I.itemName
      FROM Items AS I
      INNER JOIN UsersItems AS UI ON UI.FK_items_itemId = I.itemId
      INNER JOIN Users AS U ON U.userId = UI.FK_users_userId
      INNER JOIN ItemsUnits AS IU ON I.itemId = IU.FK_items_itemId
      INNER JOIN Units ON IU.FK_units_unitId = Units.unitId
      WHERE U.userId = ${req.params.userid}
        AND UI.spoilageDate <= (SELECT CURRENT_DATE+5)
        AND UI.finished = false
      ORDER BY UI.spoilageDate`
  );
    res.json(getSpoilSoonIngredientsData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//Get all ingredients in fridge
app.get('/api/users/:userid/ingredients/infridge', async(req,res) => {
  try{
    const getInFridgeIngredientsData = await pool.query(
      `SELECT
	      I.itemName
      FROM Items AS I
      INNER JOIN UsersItems AS UI ON UI.FK_items_itemId = I.itemId
      INNER JOIN Users AS U ON U.userId = UI.FK_users_userId
      INNER JOIN ItemsUnits AS IU ON I.itemId = IU.FK_items_itemId
      INNER JOIN Units ON IU.FK_units_unitId = Units.unitId
      WHERE U.userId = ${req.params.userid}
        AND UI.finished = false
      ORDER BY UI.spoilageDate`
  );
    res.json(getInFridgeIngredientsData.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool;
