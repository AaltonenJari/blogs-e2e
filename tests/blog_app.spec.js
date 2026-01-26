const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, ceaateBlog, createBlogWithLikes, openBlog, attemptLogin } = require('./helper')

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

  test('Login form is shown', async ({ page }) => {
	  await page.getByRole('button', { name: 'login' }).click()
	
    const locator = page.getByText('Log in to application')
    await expect(locator).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await attemptLogin(page, 'mluukkai', 'wrong')
      await expect(page.getByText('wrong username or password')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByText('logged in')).toBeVisible()
    })

    test('a new blog can be created', async ({ page }) => {
      await ceaateBlog(page, 'Testing with Playwright', 'Playwright Author', 'http://playwright.dev')
      await expect(page.getByText('Testing with Playwright Playwright Author')).toBeVisible()
    })

    test('user can like a blog', async ({ page }) => {
      const blogId = await ceaateBlog(page, 'Liking blogs', 'Like Author', 'http://like.dev')
      await openBlog(page, blogId)
      const likeButton = page.getByRole('button', { name: 'like' })
      await likeButton.click()
      const likes = page.getByText('likes 1')
      await expect(likes).toBeVisible()
    })

    test('user can delete their blog', async ({ page }) => {
      const blogId = await ceaateBlog(page, 'Deleting blogs', 'Delete Author', 'http://delete.dev')
      await openBlog(page, blogId)

      // Handle confirmation dialog on delete before clicking delete button
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        await dialog.accept()
      })

      const deleteButton = page.getByRole('button', { name: 'remove' })
      await deleteButton.click()
      await expect(page.getByText('Deleting blogs Delete Author')).not.toBeVisible()
    })

    test('users cannot delete blogs created by others', async ({ page, request }) => {
      // Create a blog with the first user
      const blogId = await ceaateBlog(page, 'Other users blog', 'Other Author', 'http://other.dev')
      await openBlog(page, blogId)

      // Logout the first user
      await page.getByRole('button', { name: 'logout' }).click()

      // Create a second user
      await request.post('http://localhost:3003/api/users', {
        data: { 
          name: 'Second User',
          username: 'seconduser', 
          password: 'password123'
        }
      })  
      // Login as the second user
      await loginWith(page, 'seconduser', 'password123')
      await expect(page.getByText('Second User logged in')).toBeVisible()
      await expect(page.getByText('Other users blog Other Author')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()
      const deleteButton = page.getByRole('button', { name: 'remove' })
      await expect(deleteButton).not.toBeVisible()
    })

    test('only the user who created a blog can see the delete button', async ({ page, request }) => {
      // Create a blog with the first user
      const blogId =await ceaateBlog(page, 'Visibility of delete button', 'Visibility Author', 'http://visibility.dev') 
      await openBlog(page, blogId)

      // Logout the first user
      await page.getByRole('button', { name: 'logout' }).click()
      
      // Create a second user
      await request.post('http://localhost:3003/api/users', {
        data: { 
          name: 'Third User',
          username: 'thirduser', 
          password: 'password456'
        }
      })
      // Login as the second user
      await loginWith(page, 'thirduser', 'password456')

      // Verify the login was successful
      await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()

      await expect(page.getByText('Visibility of delete button Visibility Author')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()
      const deleteButton = page.getByRole('button', { name: 'remove' })
      await expect(deleteButton).not.toBeVisible()
    })
    
    test('blogs are ordered according to likes', async ({ page, request }) => {
      await createBlogWithLikes(request, {
        title: 'First Blog',
        author: 'Author One',
        url: 'http://first.dev'
      }, 1, token)

      await createBlogWithLikes(request, {
        title: 'Second Blog',
        author: 'Author Two',
        url: 'http://second.dev'
      }, 2, token)

      await createBlogWithLikes(request, {
        title: 'Third Blog',
        author: 'Author Three',
        url: 'http://third.dev'
      }, 3, token)

      await page.reload()
      const blogs = page.locator('[data-testid^="blog-"]')

      await expect(blogs.nth(0)).toContainText('Third Blog')
      await expect(blogs.nth(1)).toContainText('Second Blog')
      await expect(blogs.nth(2)).toContainText('First Blog')
    })

  })  
})