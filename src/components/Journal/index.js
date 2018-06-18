import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "react-emotion";
import { Card } from "semantic-ui-react";
import Entry from "./Entry";
import Composer from "./Composer";

const JournalContainer = styled.div`
  margin: 10px 0 0 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
`;

class Journal extends Component {
  static propTypes = {
    stitchClient: PropTypes.object.isRequired,
    currentUser: PropTypes.any.isRequired,
  };

  constructor(props) {
    super(props);
    const { stitchClient } = this.props;
    const mongodb = stitchClient.service("mongodb", "mongodb-atlas");

    this.entries = mongodb.db("journal").collection("entries");
    this.state = {
      entries: []
    };
  }

  async componentDidMount() {
    // TODO: Fetch existing journal entries
    const entries = await this.entries.find({}).execute();

    // Add entries to Component State
    this.setState({ entries });
  }

  addEntry = async (title = "Untitled", body) => {
    const { currentUser } = this.props;
    const newEntry = {
      title,
      body,
      owner_id: currentUser.user_id,
      author: currentUser.data.email,
      date: new Date(),
      sharedWith: []
    };

    // TODO: Add newEntry to MongoDB
    const result = await this.entries.insertOne(newEntry);
    newEntry._id = result.insertedId;

    // Add newEntry to Component State
    this.setState(({ entries }) => ({
      entries: [...entries, newEntry]
    }));
  };

  removeEntry = async entryId => {
    // TODO: Delete the entry from MongoDB
    await this.entries.deleteOne({ _id: entryId });

    // Remove Entry from Component State
    this.setState(({ entries }) => ({
      entries: entries.filter(entry => entry._id !== entryId)
    }));
  };

  updateEntry = async (entryId, newBody) => {
    // TODO: Update the Entry body in MongoDB
    await this.entries.updateOne(
      { _id: entryId },
      { $set: { body: newBody } }
    );

    // Update the Entry body and disable editing in Component State
    this.setState(({ entries }) => ({
      entries: entries.map(
        entry =>
          entry._id === entryId
            ? { ...entry, body: newBody, isEditable: false }
            : entry
      )
    }));
  };

  shareEntry = async (entryId, email) => {
    // TODO: Add the provided email to the Entry sharedWith array in MongoDB
    await this.entries.updateOne(
      { _id: entryId },
      { $push: { sharedWith: email } }
    );

    // Add the provided email to the Entry sharedWith array in Component State
    this.setState(({ entries }) => ({
      entries: entries.map(
        entry =>
          entry._id === entryId
            ? { ...entry, sharedWith: [...entry.sharedWith, email] }
            : entry
      )
    }));
  };

  unshareEntry = async (entryId, email) => {
    // TODO: Remove the provided email from the Entry sharedWith array in MongoDB
    await this.entries.updateOne(
      { _id: entryId },
      { $pull: { sharedWith: email } },
      { multi: true }
    );

    // Remove the provided email from the Entry sharedWith array in Component State
    this.setState(({ entries }) => ({
      entries: entries.map(
        entry =>
          entry._id === entryId
            ? {
                ...entry,
                sharedWith: entry.sharedWith.filter(e => e !== email)
              }
            : entry
      )
    }));
  };

  editEntry = entryId => {
    // Enable Entry editing in Component State
    this.setState(({ entries }) => ({
      entries: entries.map(
        entry =>
          entry._id === entryId ? { ...entry, isEditable: true } : entry
      )
    }));
  };

  cancelEditEntry = entryId => {
    // Discard any text the user entered and disable editing in Component State
    this.setState(({ entries }) => ({
      entries: entries.map(
        entry =>
          entry._id === entryId ? { ...entry, isEditable: false } : entry
      )
    }));
  };

  renderEntries = () => {
    const { currentUser } = this.props;
    const entryHandlers = {
      remove: this.removeEntry,
      update: this.updateEntry,
      share: this.shareEntry,
      unshare: this.unshareEntry,
      edit: this.editEntry,
      cancelEdit: this.cancelEditEntry
    };
    return this.state.entries.map(entry => (
      <Entry
        {...entry}
        entryHandlers={entryHandlers}
        key={entry._id}
        isEditable={entry.isEditable}
        currentUserIsAuthor={entry.author === currentUser.data.email}
      />
    ));
  };

  render() {
    return (
      <JournalContainer>
        <Composer submitHandler={this.addEntry} />
        {this.state.entries.length <= 0 ? (
          <h2>No entries.</h2>
        ) : (
          <Card.Group centered itemsPerRow={1}>
            {this.renderEntries()}
          </Card.Group>
        )}
      </JournalContainer>
    );
  }
}

export default Journal;
