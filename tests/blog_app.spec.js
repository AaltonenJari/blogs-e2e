const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog, createBlogWithLikes, openBlog, attemptLogin } = require('./helper')

describe('Blog app', () => {
  let token

  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })
  
    const loginResponse = await request.post('http://localhost:3003/api/login', {
      data: {
          username: 'mluukkai',
          password: 'salainen'
        }
      })
  
    const body = await loginResponse.json()
    token = body.token

    await page.goto('http://localhost:3000')
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'wrong')
      await expect(page.getByText('wrong username or password')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'Testing with Playwright', 'Playwright Author', 'http://playwright.dev')

      const blogList = page.locator('ul')
      await expect(blogList.getByRole('link', { name: 'Testing with Playwright' })).toBeVisible()
    })

    test('user can like a blog', async ({ page }) => {
      await createBlog(page, 'Liking blogs', 'Like Author', 'http://like.dev')
      await openBlog(page, 'Liking blogs')

      await expect(page.getByText('likes 0')).toBeVisible()

      const likeButton = page.getByRole('button', { name: 'like' })
      await expect(likeButton).toBeVisible()
      await likeButton.click()
  
      const likes = page.getByText('likes 1')
      await expect(likes).toBeVisible()
    })

    test('user can delete their blog', async ({ page }) => {
      await createBlog(page, 'Deleting blogs', 'Delete Author', 'http://delete.dev')
      await openBlog(page, 'Deleting blogs')

      // Handle confirmation dialog on delete before clicking delete button
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        await dialog.accept()
      })

      const deleteButton = page.getByRole('button', { name: 'remove' })
      await deleteButton.click()

      const blogList = page.locator('ul')
      await expect(blogList.getByRole('link', { name: 'Deleting blogs' })).not.toBeVisible()
    })

  })  
})