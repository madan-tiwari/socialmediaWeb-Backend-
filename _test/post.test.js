const Post = require('../../models/post');

const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/testSocialNetwork';

beforeAll(async () => {
   await mongoose.connect(url, {
      useNewUrlParser: true,
      useCreateIndex: true
   });
});

afterAll(async () => {
 await mongoose.connection.close();
});

describe('Post Schema', () => {

   it('Creates a Post', () => {
      let post = {
         'title':'Title 1',
         'body':'This is title 1s Description'
      };
      return Post.create(post)
         .then((pp) => {
            expect(pp.title).toEqual('Title 1');
         });
   });


   it('should be able to add post about', async () => {
      const post = await Post.findOne({ 'title': 'Title 1' });
      
      post.title ="Updated Title";

      let updatedPoster = await post.save();
      expect(updatedPoster.title).toEqual("Updated Title");
  });


   it('to test whether delete function works or not', async () => {
      const status = await Post.deleteMany();
      expect(status.ok).toBe(1);
   });

})