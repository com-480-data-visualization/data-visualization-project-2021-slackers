<!-- markdownlint-disable MD036 -->

# Project of Data Visualization (COM-480)

| Student's name   | SCIPER |
| ---------------- | ------ |
| Baris Sevilmis   | 306798 |
| Furkan Karakas   | 306399 |
| Alexandre Luster | 289240 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2-7th-may-5pm) • [Milestone 3](#milestone-3-4th-june-5pm)

## Milestone 1
### Dataset

We will use the [big five personality dataset](https://github.com/automoto/big-five-data). It contains a csv file (big_five_scores.csv) which has the personality scores for the five big personality traits (agreeableness, extraversion, openness, conscientiousness and neuroticism) for 300'000 respondents, along with their country of origin, age and sex.

**Pre-processing to do:**
The dataset is convenient to use, with few missing values and problems to handle:

- Only the "country" field has missing values. These only make up for approximately 0.05% of the dataset, so we will discard these entries.

- The country names are non-standardized and have been cut if longer than 10 letters. We had to map these values to a standard country code in a semi-automated way.

There are no missing values in the other fields, which are ready to use as they are. 

### Problematic

We want to explore whether people from different geographic regions, age groups or sex display different personalities. More specifically, our purpose is to discover domain personalities of people from different ages, sexes and countries according to the big five personnality traits.

To show how personality varies geographically, we will demonstrate a world map, colored according to each country's mean score in one personality trait. The user will be able to chose which personality trait he/she wants to explore. The user will also be able to click on a country to discover how the personality differs by age and sex within that country.

### Exploratory Data Analysis

**TODO:** Refer to the notebook in this section.

### Related work

We found this dataset in the mentioned Github repository. In the same repository, the user has already preprocessed the dataset and he has created some reports. For example, in the `reports` folder, the user has already written the top and bottom 100 of the five personality scores in `csv` files. We researched as well in the internet if there have been other visualization projects concerning the personality tests, however we did not succeed finding additional work including our data. In this sense, our approach is original because of the lack of previous visualizations of personalities with demographic information world-wide.

We were especially inspired by other world-wide visualization projects. One of them is the estimation of life satisfaction per country basis on a world heatmap. The corresponding visualization can be found [here](https://i.redd.it/aqcardzlrik51.png).

Another inspiration for us was one of the projects from previous years in this course. In that project, the group visualized the olympic events in the world throughout the history. They used a world map to display the number of participants from each country. We decided that usage of world map with interesting information results in decent visualizations. The website of that project can be found in [this link](https://com-480-data-visualization.github.io/com-480-project-knn-viz/website/map.html).

Lastly, Covid-19 was among our inspirations due to the its pyschological effect on people. This lead our interests to work with psychology based data.

We would like to mention that we have never used this dataset in any of our past works before.

## Milestone 2 (7th May, 5pm)

**10% of the final grade**

## Milestone 3 (4th June, 5pm)

**80% of the final grade**

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
