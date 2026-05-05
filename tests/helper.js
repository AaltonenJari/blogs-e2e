const { expect } = require('@playwright/test')

const loginWith = async (page, username, password) => {
  const loginLink = page.getByRole('link', { name: 'login' })
  await expect(loginLink).toBeVisible()
  await loginLink.click()

  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const attemptLogin = async (page, username, password) => {
  await page.getByRole('button', { name: 'login' }).click()
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const createBlog = async (page, title, author, url) => {
  const newBlogLing = page.getByRole('link', { name: 'new blog' })
  await expect(newBlogLing).toBeVisible()
  await newBlogLing.click()

  await page.getByLabel('title:').fill(title)
  await page.getByLabel('author:').fill(author)
  await page.getByLabel('url:').fill(url)

  // Prepare to capture the response for blog creation
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/api/blogs') && response.request().method() === 'POST'
  )

  await page.getByRole('button', { name: 'create' }).click()

  // Wait for the response to get the created blog's ID
  const response = await responsePromise
  const blog = await response.json()

  // Verify that the blog appears in the list
  await expect(page.getByText( `a new blog ${title} by ${author} added`)).toBeVisible()

  return blog.id
}

const createBlogWithLikes = async (request, blog, likes, token) => {
  await request.post('http://localhost:3003/api/blogs', {
    data: { ...blog, likes },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

const openBlog = async (page, title) => {
  await page.getByRole('link', { name: title }).click()
}

export { loginWith, createBlog, createBlogWithLikes, openBlog, attemptLogin }