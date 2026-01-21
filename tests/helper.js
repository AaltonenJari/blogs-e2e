const { expect } = require('@playwright/test')

const loginWith = async (page, username, password)  => {
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

const likeBlog = async (page, blogId, times) => {
  const blog = page.getByTestId(`blog-${blogId}`)
  const likeButton = blog.getByTestId(`like-${blogId}`)
  const likes = blog.getByTestId(`likes-${blogId}`)

  for (let i = 0; i < times; i++) {
    await likeButton.click()
    await expect(likes).toHaveText(`likes ${i + 1}`)
  }
}

export { loginWith, ceaateBlog, likeBlog }