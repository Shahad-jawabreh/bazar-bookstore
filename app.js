const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors'); // Import cors
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const PORT = 3000;
app.use(cors());

// Function to read CSV file and return parsed results
async function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

async function updateCatalogStock(bookId, newStock) {
    try {
        const catalog = await readCsv('catalogData.csv');
        const bookIndex = catalog.findIndex(book => parseInt(book.ID) === bookId);

        if (bookIndex !== -1) {
            catalog[bookIndex].Stock = newStock; // Ensure correct casing

            const csvWriter = createObjectCsvWriter({
                path: 'catalogData.csv',
                header: [
                    { id: 'ID', title: 'ID' }, // Ensure casing matches the CSV
                    { id: 'Title', title: 'Title' },
                    { id: 'Topic', title: 'Topic' },
                    { id: 'Price', title: 'Price' },
                    { id: 'Stock', title: 'Stock' },
                ],
            });

            await csvWriter.writeRecords(catalog);
            console.log(`Stock for Book ID ${bookId} updated successfully.`);
        } else {
            console.log(`Book ID ${bookId} not found in catalog.`);
        }
    } catch (error) {
        console.error('Error updating catalog stock:', error);
    }
}

// Search by topic
app.get('/search/:topic', async (req, res) => {
    try {
        const catalog = await readCsv('catalogData.csv'); // Await the reading of the CSV
        const topic = req.params.topic.toLowerCase();
        const filteredResults = catalog.filter(book => book.Topic.toLowerCase() === topic);
        res.json(filteredResults);
    } catch (error) {
        res.status(500).send('Error reading catalog data');
    }
});
app.post('/stock/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const catalog = await readCsv('catalogData.csv');
        console.log(catalog);
        const book = catalog.find(b => parseInt(b.ID) === id);
        if (book && parseInt(book.Stock) > 0) { // Ensure to parse stock to an integer
            // Update the stock
            const newStock = parseInt(book.Stock) - 1; // Decrement stock
            await updateCatalogStock(id, newStock); // Update catalog stock

            // Create a new order
        
            res.send(`purchased successfully..`);
        } else {
            res.send('Out of stock');
        }
    } catch (error) {
        console.error('Error purchasing the book:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Get book info by ID
app.get('/info/:id', async (req, res) => {
    try {
        const catalog = await readCsv('catalogData.csv'); // Await the reading of the CSV
        const id = parseInt(req.params.id);
        const book = catalog.find(b => parseInt(b.ID) === id);
        if (book) {
            res.json(book);
        } else {
            res.status(404).send('Book not found');
        }
    } catch (error) {
        res.status(500).send('Error reading catalog data');
    }
});

app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
});
