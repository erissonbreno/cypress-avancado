describe('Hacker Stories', () => {
    const initialTerm = 'React'
    const newTerm = 'Cypress'
    context('Hitting the real API', () => {
        beforeEach(() => {
            cy.intercept({
                method: 'GET',
                pathname: '**/search',
                query: {
                    query: initialTerm,
                    page: '0'
                }
            }).as('getStories')

            cy.visit('/')
            cy.wait('@getStories')
        })

        it('shows 20 stories, then the next 20 after clicking "More"', () => {
            cy.intercept({
                method: 'GET',
                pathname: '**/search',
                query: {
                    query: initialTerm,
                    page: '1'
                }
            }).as('getNextStories')

            cy.get('.item')
                .should('be.visible')
                .should('have.length', 20)

            cy.contains('More').click()

            cy.wait('@getNextStories')

            cy.get('.item')
                .should('be.visible')
                .should('have.length', 40)
        })

        it.only('searches via the last searched term', () => {
            cy.intercept({
                method: 'GET',
                pathname: '**/search',
                query: {
                    query: `${newTerm}`,
                    page: '0'
                }
            }).as('getNewTermStories')

            cy.get('#search')
                .should('be.visible')
                .clear()
                .type(`${newTerm}{enter}`)

            cy.wait('@getNewTermStories')

            cy.getLocalStorage('search')
                .should('be.equal', newTerm)

            cy.get(`button:contains(${initialTerm})`)
                .should('be.visible')
                .click()

            cy.wait('@getStories')

            cy.getLocalStorage('search')
                .should('be.equal', initialTerm)

            cy.get('.item')
                .should('be.visible')
                .should('have.length', 20)
                .first()
                .should('contain', initialTerm)

            cy.get(`button:contains(${newTerm})`)
                .should('be.visible')
        })
    })

    context('Mocking the API', () => {
        context('Footer and list of stories', () => {
            beforeEach(() => {
                cy.intercept(
                    'GET',
                    `**/search?query=${initialTerm}&page=0`,
                    {fixture: 'stories'}
                ).as('getStories')

                cy.visit('/')
                cy.wait('@getStories')
            })

            it('shows the footer', () => {
                cy.get('footer')
                    .should('be.visible')
                    .and('contain', 'Icons made by Freepik from www.flaticon.com')
            })

            context('List of stories', () => {
                const stories = require('../fixtures/stories.json')
                it('shows the right data for all rendered stories', () => {
                    cy.get('.item').each(($item, index) => {
                        cy.wrap($item)
                            .should('contain', stories.hits[index].title)
                            .and('contain', stories.hits[index].author)
                            .and('contain', stories.hits[index].num_comments)
                            .and('contain', stories.hits[index].points)
                        cy.get(`.item a:contains(${stories.hits[index].title})`)
                            .should('have.attr', 'href', stories.hits[index].url)
                    })
                })

                it.skip('shows one less story after dismissing the first story', () => {
                    cy.get('.button-small')
                        .should('be.visible')
                        .last()
                        .click()

                    cy.get('.button-small').should('have.length', 2)
                })

                context('Order by', () => {
                    it('orders by title', () => {
                        cy.get('.list-header-button:contains(Title)')
                            .should('be.visible')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[0].title)
                        cy.get(`.item a:contains(${stories.hits[0].title})`)
                            .should('have.attr', 'href', stories.hits[0].url)

                        cy.get('.list-header-button:contains(Title)')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[2].title)
                        cy.get(`.item a:contains(${stories.hits[2].title})`)
                            .should('have.attr', 'href', stories.hits[2].url)
                    })

                    it('orders by author', () => {
                        cy.get('.list-header-button:contains(Author)')
                            .should('be.visible')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[0].author)

                        cy.get('.list-header-button:contains(Author)')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[2].author)
                    })

                    it('orders by comments', () => {
                        cy.get('.list-header-button:contains(Comments)')
                            .should('be.visible')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[2].num_comments)

                        cy.get('.list-header-button:contains(Comments)')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[0].num_comments)
                    })

                    it('orders by points', () => {
                        cy.get('.list-header-button:contains(Points)')
                            .should('be.visible')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[2].points)

                        cy.get('.list-header-button:contains(Points)')
                            .click()

                        cy.get('.item')
                            .first()
                            .should('be.visible')
                            .and('contain', stories.hits[1].points)
                    })
                })
            })
        })

        context('Search', () => {
            beforeEach(() => {
                cy.intercept(
                    'GET',
                    `**/search?query=${initialTerm}&page=0`,
                    {fixture: 'empty'}
                ).as('getEmptyStories')

                cy.intercept(
                    'GET',
                    `**/search?query=${newTerm}&page=0`,
                    {fixture: 'stories'}
                ).as('getStories')

                cy.visit('/')
                cy.wait('@getEmptyStories')

                cy.get('#search')
                    .should('be.visible')
                    .clear()
            })

            it('types and hits ENTER', () => {
                cy.get('#search')
                    .should('be.visible')
                    .type(`${newTerm}{enter}`)

                cy.wait('@getStories')
                cy.get('.item')
                    .should('be.visible')
                    .should('have.length', 3)
                cy.get(`button:contains(${initialTerm})`)
                    .should('be.visible')
            })

            it('types and clicks the submit button', () => {
                cy.get('#search')
                    .should('be.visible')
                    .type(newTerm)
                cy.contains('Submit')
                    .click()

                cy.wait('@getStories')

                cy.get('.item')
                    .should('be.visible')
                    .should('have.length', 3)
                cy.get(`button:contains(${initialTerm})`)
                    .should('be.visible')
            })

            it('types and submit the form directly', () => {
                cy.get('#search')
                    .should('be.visible')
                    .type(newTerm)
                cy.get('form').submit()

                cy.wait('@getStories')

                cy.get('.item').should('have.length', 3)
            })

            it('shows no story when none is returned', () => {
                cy.get('.item').should('not.exist')
            })

            context('Last searches', () => {
                it('shows a max of 5 buttons for the last searched terms', () => {
                    const faker = require('faker')

                    cy.intercept(
                        'GET',
                        '**/search**',
                        {fixture: 'empty'}
                    ).as('getRandomStories')

                    Cypress._.times(6, () => {
                        cy.get('#search')
                            .should('be.visible')
                            .clear()
                            .type(`${faker.random.word()}{enter}`)
                        cy.wait('@getRandomStories')
                    })

                    cy.get('.last-searches button')
                        .should('be.visible')
                        .should('have.length', 5)
                })
            })
        })
    })
})

context('Errors', () => {
    it('shows "Something went wrong ..." in case of a server error', () => {
        cy.intercept(
            'GET',
            '**/search**',
            {statusCode: 500}
        ).as('getServerFailure')

        cy.visit('/')

        cy.wait('@getServerFailure')

        cy.get('p:contains(Something went wrong ...)')
    })

    it('shows "Something went wrong ..." in case of a network error', () => {
        cy.intercept(
            'GET',
            '**/search**',
            {forceNetworkError: true}
        ).as('getNetworkFailure')

        cy.visit('/')

        cy.wait('@getNetworkFailure')

        cy.get('p:contains(Something went wrong ...)')
    })
})
