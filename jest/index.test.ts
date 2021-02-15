import {jest} from '@jest/globals';

jest.useFakeTimers();


// test('user.title is Singer', () => {
//   expect(user.title).toBe('Singer');
// })

// test('user.name is Izumi Sakai', async () => {
//   expect.assertions(1);
//   console.log("=================>", user);
//   expect(user.name).toBe('Izumi Sakai')
// })

describe('Test Dmeo', () => {
  it('works', () => {
    expect("Just a test").toEqual("Just a test");
    // expect(user.name).toEqual("Izumi Sakai");
  });
});
