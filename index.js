const port = process.env.PORT || 4000;

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require("path");
const cors = require('cors');
const {body, validationResult} = require('express-validator');
const app = express();


app.use(express.json());
app.use(cors());

// Database connection with mongodb

mongoose.connect("mongodb+srv://codewithaayush:Aayush1404@cluster0.vhbmmws.mongodb.net/e-commerce", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Failed to connect to MongoDB:", err));



  
// API creatiion

app.listen(port, (err) => {
    if (!err) {
        console.log(`Connected to port ${port}`)
    }
    else {
        console.log("error in conenction")
    }
})


app.get('/', (req, res) => {
    res.send("Express app is running ");
})





// Image storage engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
}
)


const upload = multer({ storage: storage })


// Creating endpoint for uploading images
app.use('/images', express.static('upload/images'))


app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    })
})


//Schema for creating products

const Product = mongoose.model("website1", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image1: {
        type: String,
        required: true,
    },
    image2: {
        type: String,
        required: true,
    },
    image3: {
        type: String,
        required: true,
    },

    category: {
        type: String,
        required: true
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    }
})


app.post("/addproduct", async (req, res) => {

    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }



    const product = new Product({
        id: id,
        name: req.body.name,
        image1: req.body.image1,
        image2: req.body.image2,
        image3: req.body.image3,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})


// Subscription Schema
const Subscription = mongoose.model("Subscription", {
    email: {
        type: String,
        required: true,
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});
//api for suscribtion

// Endpoint to handle email subscriptions
app.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    
    // Basic email validation
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        // Check if email already exists
        let existingSubscription = await Subscription.findOne({ email });
        if (existingSubscription) {
            return res.status(400).json({ error: 'Email is already subscribed' });
        }

        // Save new subscription
        const subscription = new Subscription({ email });
        await subscription.save();

        res.status(200).json({ message: 'Thank you for subscribing!' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});


// Api for deleting product

app.post('/removeproduct',async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("removed");
    res.json({
        success:true,
        name:req.body.name,
    })
})


//creating api for getting all product 


app.get("/allproducts", async (req,res)=>{
    let products = await Product.find({});
    console.log("product fetched");
    res.send(products);
})



// Creating schema for user model 

const Users  = mongoose.model('User',{
    name:{
        type: String
    },
    email:{
        type: String,
        unique:true
    },
    password:{
        type: String
    },
    cartData:{
        type: Object
    },
    date:{
        type:Date,
        default: Date.now,
    }
})


//creating endpoint for registering the user
app.post(
    '/signup',
    // Validation middleware
    [
      body('username').not().isEmpty().withMessage('Username is required'),
      body('email').isEmail().withMessage('Invalid email format'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    async (req, res) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
  
      // Check if user already exists
      let check = await Users.findOne({ email: req.body.email });
      if (check) {
        return res.status(400).json({ success: false, error: 'User already exists' });
      }
  
      // Create default cart
      let cart = {};
      for (let i = 1; i <= 300; i++) {
        cart[i] = 0;
      }
  
      // Create new user
      const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password, // Ensure you hash the password before saving it
        cartData: cart,
      });
  
      await user.save();
  
      // Generate JWT token
      const data = {
        user: {
          id: user.id
        }
      };
  
      const token = jwt.sign(data, 'ajariwala');
  
      res.json({ success: true, token });
    }
  );


// Endpoint for user login
    
app.post('/login',async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user)
    {
        const passCompare = req.body.password === user.password;
        if(passCompare)
        {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'ajariwala');
            res.json({success:true, token});
        }
        else
        {
            res.json({success:false, errors:"wrong password"});
        }
    }
    else
    {
        res.json({success:false, errors:"wrong email"});
    }
})


// creating endpoint for newcollection data
app.get('/newcollections', async (req, res)=>{
    let product = await Product.find({});
    let newCollection = product.slice(1).slice(-8);
    console.log("new collection fetched");
    res.send(newCollection);
})


// endppoint for our modt popular section 

app.get('/ourmostpopular', async(req, res)=>{
    let product = await Product.find({});
    let mostPopularProduct = product.slice(0,4);
    console.log("most popular product fetched");
    res.send(mostPopularProduct);

})



// creating middleware to fetch user

const fetchUser = async (req, res, next)=>{
    const token = req.header('auth-token');
    if(!token)
    {
         res.status(401).send({errors:"Please authenticate using valid token"})

    }
    else
    
    {
        try {
            const data = jwt.verify(token,'ajariwala');
            req.user = data.user;
            next();
            
        } catch (error) {
            res.status(401).send({errors:"Please authetucate "})
        }
    }
}



// creating endpoint for for adding products in cart

app.post('/addtocart', fetchUser, async (req, res)=>{
    console.log(req.body, req.user);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("added");


})


// creating endpoint to remove from cart
app.post('/removefromcart', fetchUser, async (req, res)=>{
    console.log(req.body, req.user);
    let userData = await Users.findOne({_id:req.user.id});


    if(userData.cartData[req.body.itemId] > 0)
    {
        userData.cartData[req.body.itemId] -= 1;
    }


    
    await Users.findByIdAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("removed");


})


//creating endpoint to retrive cart data of particular user

app.post('/getcart', fetchUser,  async  (req, res)=>{
    console.log("getcart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData );   
})
