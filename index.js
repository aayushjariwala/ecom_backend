const port = process.env.PORT || 4000;

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require("path");
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const app = express();

// Middleware
app.use(express.json());  // Parse incoming JSON requests

// CORS Configuration
const corsOptions = {
  origin: '*',  // Allow all origins for now (you can restrict this to specific domains later)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
};
app.use(cors(corsOptions));

// Database connection with MongoDB
mongoose.connect("mongodb+srv://codewithaayush:Aayush1404@cluster0.vhbmmws.mongodb.net/e-commerce", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB:", err));

// API creation
app.listen(port, (err) => {
  if (!err) {
    console.log(`Connected to port ${port}`);
  } else {
    console.log("Error in connection");
  }
});

// Root route
app.get('/', (req, res) => {
  res.send("Express app is running");
});

// Image storage engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
});
const upload = multer({ storage: storage });

// Serve static images
app.use('/images', express.static('upload/images'));

// Image upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
});

// Schema for creating products
const Product = mongoose.model("Product", {
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
});

// Endpoint to add products
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product = products.slice(-1)[0];
    id = last_product.id + 1;
  } else {
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

  await product.save();
  res.json({ success: true, product });
});

// Endpoint to get all products
app.get("/allproducts", async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("Products fetched");
    res.json(products);  // Return as JSON
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to delete a product
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true, message: "Product removed" });
});

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

// Endpoint to handle subscriptions
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    let existingSubscription = await Subscription.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({ error: 'Email is already subscribed' });
    }

    const subscription = new Subscription({ email });
    await subscription.save();
    res.status(200).json({ message: 'Thank you for subscribing!' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
});

// User Schema
const User = mongoose.model('User', {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now }
});

// Endpoint to register user
app.post('/signup', [
  body('username').not().isEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  let check = await User.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, error: 'User already exists' });
  }

  let cart = {};
  for (let i = 1; i <= 300; i++) {
    cart[i] = 0;
  }

  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();
  
  const token = jwt.sign({ id: user.id }, 'ajariwala');
  res.json({ success: true, token });
});

// Middleware to fetch user
const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).json({ errors: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, 'ajariwala');
    req.user = data;
    next();
  } catch (error) {
    res.status(401).json({ errors: "Please authenticate" });
  }
};



// Cart-related routes...
// (addtocart, removefromcart, getcart, etc.)

