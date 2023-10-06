const express = require('express')
const router = express.Router();
const request = require("request");
const _ = require("lodash");
require('dotenv').config();


const app = express()
const port = process.env.PORT;



//middleware
app.use('/api', router)
app.use(express.json());

const requestOption = {
    method: 'GET',
    url: process.env.API_URL,
    headers: {
        'x-hasura-admin-secret': process.env.ADMIN_SECRET
    }
};

const calculateAnalyticsMemoized = _.memoize((blogData) => {
    const totalBlogs = blogData.blogs.length;
    const blogWithLongestTitle = _.maxBy(blogData.blogs, (blog) => blog.title.length);
    const numberOfBlogsWithPrivacyTitle = _.filter(blogData.blogs, (blog) =>
        blog.title && blog.title.toLowerCase().includes('privacy')
    ).length;
    const uniqueBlogTitles = _.uniqBy(blogData.blogs, 'title');
    return {
        totalBlogs,
        blogWithLongestTitle,
        numberOfBlogsWithPrivacyTitle,
        uniqueBlogTitles,
    };
}, (blogData) => blogData.length);

router.get('/blog-stats', (req, res) => {

    request(requestOption, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            const blogData = JSON.parse(body);

            
            const filteredData = calculateAnalyticsMemoized(blogData)

            //data analytics
            const totalBlogs = filteredData.totalBlogs;
            const blogWithLongestTitle = filteredData.blogWithLongestTitle;
            const numberOfBlogsWithPrivacyTitle = filteredData.numberOfBlogsWithPrivacyTitle;
            const uniqueBlogTitles = filteredData.uniqueBlogTitles;

            const data = {
                totalBlogs,
                blogWithLongestTitle,
                numberOfBlogsWithPrivacyTitle,
                uniqueBlogTitles,
            };

            //respond to client
            res.status(200).json(data);
        }
        else {
            console.log("Errorr")
            res.status(400).send({error})
        }
    });
})
    .get('/blog-search', (req, res) => {
        const query = req.query.query
        if (!query) {
            return res.status(400).json({ error: 'Query parameter "query" is required' });
          }

        request(requestOption, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const blogData = JSON.parse(body);

                if (query == 'privacy') {
                    const privateTitledData = _.filter(blogData.blogs, (blog) =>
                        blog.title.toLowerCase().includes('privacy'));
                    res.send(privateTitledData);
                }
                else if (query == 'policy') {
                    const policyTitledData = _.filter(blogData.blogs, (blog) =>
                        blog.title.toLowerCase().includes('policy'));
                    res.send(policyTitledData);
                }
                else if (query == 'money') {
                    const moneyTitledData = _.filter(blogData.blogs, (blog) =>
                        blog.title.toLowerCase().includes('money'));
                    res.send(moneyTitledData);
                }
            }else {
                console.error('Error making request:', error);
                res.status(500).json({ error: 'Failed to retrieve blog data' });
              }


        })
    })



app.listen(port, () => {
    console.log(`Example Server listening on port ${port}`)
})