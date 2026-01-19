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
  await responsePromise
}

const blogByTitle = (page, title) =>
  page.getByTestId('blog').filter({ hasText: title })

export { loginWith, ceaateBlog, blogByTitle }