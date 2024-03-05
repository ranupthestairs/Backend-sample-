import mongoose from 'mongoose';

export const getDataFromDB = (
    DB: mongoose.Model<any>,
    query?: any,
    sort?: any,
): Promise<mongoose.Document[]> =>
    new Promise((resolve, reject) => {
        DB.find(query || {})
            .sort(sort || {})
            .then((docs) => resolve(docs))
            .catch((err) => reject(err));
        // DB.find(query || {}, (err: any, docs: mongoose.Document[]) => {
        //     if (err) reject(err);
        //     resolve(docs);
        // });
    });
