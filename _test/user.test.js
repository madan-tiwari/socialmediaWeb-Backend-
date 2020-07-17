const User = require('../../models/user');

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

describe('User Schema', () => {

   it('Creates a User', () => {
      let user = {
         'name':'isolated',
         'email':'isolated@gmail.com',
         'password':'test'
      };
      return User.create(user)
         .then((pp) => {
            expect(pp.name).toEqual('isolated');
         });
   });


   it('should be able to add user about', async () => {
      const user = await User.findOne({ 'name': 'isolated' });
      
      user.about ="GOOD GOOD";

      let updatedUser = await user.save();
      expect(updatedUser.about).toEqual("GOOD GOOD");
  });


   it('to test whether delete function works or not', async () => {
      const status = await User.deleteMany();
      expect(status.ok).toBe(1);
   });

})