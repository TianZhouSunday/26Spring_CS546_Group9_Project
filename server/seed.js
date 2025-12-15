
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { createUser } from './data/users.js';
import { createPost } from './data/posts.js';
import commentData from './data/comments.js';

const main = async () => {
    const db = await dbConnection();
    await db.dropDatabase();

    console.log('Database initialized and cleared.');

    try {
        // Create Users
        console.log('Creating users...');
        const patrick = await createUser('patrick', 'Patrick123!', 'patrick@bikinibottom.com', false);
        const spongebob = await createUser('spongebob', 'SpongeBob123!', 'spongebob@bikinibottom.com', false);
        const squidward = await createUser('squidward', 'SquidWard123!', 'squidward@bikinibottom.com', true); // hide sensitive content
        const sandy = await createUser('sandy', 'SandyCheeks123!', 'sandy@bikinibottom.com', false);
        const mrkrabs = await createUser('mrkrabs', 'MoneyMoney123!', 'mrkrabs@bikinibottom.com', false);

        console.log('Users created:');
        console.log(`- Patrick (ID: ${patrick._id})`);
        console.log(`- SpongeBob (ID: ${spongebob._id})`);
        console.log(`- Squidward (ID: ${squidward._id})`);
        console.log(`- Sandy (ID: ${sandy._id})`);
        console.log(`- Mr. Krabs (ID: ${mrkrabs._id})`);

        // Create Posts
        console.log('\nCreating posts...');

        // Post 1: Patrick at Empire State Building
        const post1 = await createPost(
            'Is mayonnaise an instrument?',
            'I need to know for the band practice tonight.',
            null, // photo
            { latitude: 40.748817, longitude: -73.985428 }, // Empire State Building
            'Manhattan',
            false, // sensitive
            patrick._id.toString(),
            false // anonymous
        );
        console.log(`Post 1 created: ${post1.title}`);

        // Post 2: SpongeBob at Central Park
        const post2 = await createPost(
            'I am ready!',
            'Going jellyfishing in the park! Anyone want to join?',
            null,
            { latitude: 40.785091, longitude: -73.968285 }, // Central Park
            'Manhattan',
            false,
            spongebob._id.toString(),
            false
        );
        console.log(`Post 2 created: ${post2.title}`);

        // Post 3: Squidward at Brooklyn Bridge
        const post3 = await createPost(
            'Too much noise.',
            'Why must everyone be so loud? I just want to play my clarinet in peace.',
            null,
            { latitude: 40.7061, longitude: -73.9969 }, // Brooklyn Bridge
            'Brooklyn',
            false,
            squidward._id.toString(),
            false
        );
        console.log(`Post 3 created: ${post3.title}`);

        // Post 4: Sandy in Queens (Flushing Meadows)
        const post4 = await createPost(
            'Karate Practice',
            'Hy-yah! Anyone up for some sparring in Queens?',
            null,
            { latitude: 40.7484, longitude: -73.8457 }, // Flushing Meadows
            'Queens',
            false,
            sandy._id.toString(),
            false
        );
        console.log(`Post 4 created: ${post4.title}`);

        // Post 5: Mr. Krabs in the Bronx (Zoo)
        const post5 = await createPost(
            'Looking for me first dime',
            'I lost it somewhere near here. Reward: 1 penny.',
            null,
            { latitude: 40.8506, longitude: -73.8770 }, // Bronx Zoo
            'The Bronx',
            false,
            mrkrabs._id.toString(),
            false
        );
        console.log(`Post 5 created: ${post5.title}`);

        // Post 6: Anonymous post by Patrick
        const post6 = await createPost(
            'Secret Secret',
            'I have a secret box.',
            null,
            { latitude: 40.7580, longitude: -73.9855 }, // Times Square
            'Manhattan',
            true, // Sensitive
            patrick._id.toString(),
            true // Anonymous
        );
        console.log(`Post 6 created: ${post6.title} (Anonymous & Sensitive)`);


        // Create Comments
        console.log('\nCreating comments...');

        // Squidward comments on Patrick's post
        await commentData.createComment(post1._id.toString(), squidward._id.toString(), "No, Patrick, mayonnaise is not an instrument.", 1);
        console.log('Comment added to Post 1');

        // SpongeBob comments on Patrick's post
        await commentData.createComment(post1._id.toString(), spongebob._id.toString(), "Raised hand!", 5);
        console.log('Comment added to Post 1');

        // Patrick comments on SpongeBob's post
        await commentData.createComment(post2._id.toString(), patrick._id.toString(), "I'm coming too!", 5);
        console.log('Comment added to Post 2');

        // Sandy comments on Squidward's post
        await commentData.createComment(post3._id.toString(), sandy._id.toString(), "Cheer up, Squidward!", 4);
        console.log('Comment added to Post 3');

        // Mr Krabs comments on Post 4
        await commentData.createComment(post4._id.toString(), mrkrabs._id.toString(), "Does it cost money to watch?", 3);
        console.log('Comment added to Post 4');

        console.log('\nSeed script completed successfully!');

    } catch (e) {
        console.error('Error during seeding:', e);
    }

    await closeConnection();
    console.log('Database connection closed.');
};

main();
