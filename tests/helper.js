const { expect } = require('@playwright/test')

const loginWith = async (page, username, password) => {
  const logoutButton = page.getByRole('button', { name: 'logout' })

  // If already logged in, do nothing
  if (await logoutButton.count() > 0) {
    return
  }

  const loginButton = page.getByRole('button', { name: 'login' })
  await expect(loginButton).toBeVisible()
  await loginButton.click()

  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)

  await page.getByRole('button', { name: 'login' }).click()

  // Wait for login to complete
  await expect(page.getByRole('button', { name: 'logout' })).toBeVisible()
}

const attemptLogin = async (page, username, password) => {
  await page.getByRole('button', { name: 'login' }).click()
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const ceaateBlog = async (page, title, author, url) => {
  await page.getByRole('button', { name: 'new blog' }).click()

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
  await expect(
    page.locator('.blog-title', { hasText: title })
  ).toBeVisible()

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

const openBlog = async (page, blogId) => {
  const blog = page.getByTestId(`blog-${blogId}`)

  if (await blog.getByRole('button', { name: 'view' }).isVisible()) {
    await blog.getByRole('button', { name: 'view' }).click()
  }
}

export { loginWith, ceaateBlog, createBlogWithLikes, openBlog, attemptLogin }