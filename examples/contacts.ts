/**
 * This example manipulates the same dataset in many different ways in parallel
 */

import * as faker from 'faker'
import { start, job, stop } from '../src/job'

const MAX_LEN = 100000
const largeArray = Array.from({ length: MAX_LEN }).map(() => faker.helpers.userCard())

const WORKERS = 4
const datasets = []
const PART = MAX_LEN / WORKERS

const removeEmail = dataset => dataset.map(card => {
  const result = Object.assign({}, card)
  delete result.email
  return result
})

const stringifyAddress = dataset => dataset.map(card => {
  const result = Object.assign({}, card)
  result.address = `${card.address.street} ${card.address.suite}, ${card.address.city} (${card.address.zipcode})`
  return result
})

const stringifyCompany = dataset => dataset.map(card => {
  const result = Object.assign({}, card)
  result.company = `${card.company.name} - ${card.company.catchPhrase}`
  return result
})

const extractPerson = dataset => dataset.map(card => ({
  name: card.name,
  username: card.username,
  email: card.email,
}))

for (let i = 0; i < WORKERS; i++) {
  datasets.push(largeArray.slice(i * PART, (i * PART) + PART))
}

const main = async () => {
  await start({ maxWorkers: WORKERS })

  const [noEmail, addressStr, companyStr, people] = await Promise.all([
    job(dataset => removeEmail(dataset), { data: datasets[0], ctx: { removeEmail } }),
    job(dataset => stringifyAddress(dataset), { data: datasets[1], ctx: { stringifyAddress } }),
    job(dataset => stringifyCompany(dataset), { data: datasets[2], ctx: { stringifyCompany } }),
    job(dataset => extractPerson(dataset), { data: datasets[3], ctx: { extractPerson } }),
  ])

  await stop()

  console.log('*** ORIGINAL ARRAY SLICES ***')
  console.log(datasets[0].slice(0, 10))
  console.log('*** REMOVE EMAIL ARRAY SLICES ***')
  console.log(noEmail.slice(0, 10))

  console.log('*** ORIGINAL ARRAY SLICES ***')
  console.log(datasets[1].slice(0, 10))
  console.log('*** STRINGIFIED ADDRESS ARRAY SLICES ***')
  console.log(addressStr.slice(0, 10))

  console.log('*** ORIGINAL ARRAY SLICES ***')
  console.log(datasets[2].slice(0, 10))
  console.log('*** STRINGIFIED COMPANY ARRAY SLICES ***')
  console.log(companyStr.slice(0, 10))

  console.log('*** ORIGINAL ARRAY SLICES ***')
  console.log(datasets[3].slice(0, 10))
  console.log('*** PEOPLE ARRAY SLICES ***')
  console.log(people.slice(0, 10))
}

main()
