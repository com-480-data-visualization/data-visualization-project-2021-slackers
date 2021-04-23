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

We will use a [big five personality dataset](https://github.com/automoto/big-five-data). It contains a csv file (big_five_scores.csv) which has the personality scores for the five big personality traits (agreeableness, extraversion, openness, conscientiousness, and neuroticism) for 300'000 respondents, along with their country of origin, age, and sex.

**Pre-processing to do:**
The dataset is convenient to use, with few missing values and problems to handle:

- Only the "country" field has missing values. These only make up for approximately 0.05% of the dataset, so we will discard these entries.

- The country names are non-standardized and have been cut if longer than 10 letters. We had to map these values to a standard country code in a semi-automated way.

There are no missing values in the other fields, which are ready to use as they are.

### Problematic

Do people from different geographic regions, age groups or sex display different personalities ? We want to develop an online visualization that allows the user discover information about the big five personality traits, and explore how they are related to these factors interactively. The target user will most likely do so for his entertainement, but we also want to enable users to gain useful information, for example when traveling or moving to a new location. Our goal with this project is also to break stereotypes. We expect users to be curious about preconceived ideas they have, which most of the time will turn out to be unfounded.


To show how personality varies geographically, we will demonstrate a world map, colored according to each country's mean score in one personality trait. The user will be able to choose which personality trait he/she wants to explore, or to click on a country to discover how the personality differs by age and sex within that country.

### Exploratory Data Analysis

Our exploratory data analysis can be found [here](http://htmlpreview.github.io/?https://github.com/com-480-data-visualization/data-visualization-project-2021-slackers/blob/master/Milestone_1.html). We handled missing and non-standard country names and checked if the data is representative. There is roughly 1.5 more data from female respondents than males. Only a few countries have more than 1'000 entries. We also found that there is an unexpected number of respondents aged 99 years; these were considered as non-serious respondents and discarded. Additionally, we looked at the distribution of each score in the United States. Because it is unimodal and not skewed, displaying country means is somewhat reasonable.

### Related work

We found this dataset in the mentioned GitHub repository. In the same repository, the user has already preprocessed the dataset and he has created some reports. For example, in the `reports` folder, the user has already written the top and bottom 100 of the five personality scores in `csv` files. We researched as well on the internet if there have been other visualization projects concerning the personality tests, however we failed finding additional work including our data. In this sense, our approach is original because of the lack of previous visualizations of personalities with demographic information world-wide. After we got this idea, we did find a website ([here](https://www.16personalities.com/country-profiles/global/world)) that show similar world maps based on personality. However, these did not include demographics. Our project could extend their website by allowing the user to refine the search based on age and sex. We also found evidence in the literature that the big-five factors vary by country (GELADE, Garry A. Personality and place. British Journal of Psychology, 2013, vol. 104, no 1, p. 69-82.).

We were especially inspired by other world-wide visualization projects. One of them is the estimation of life satisfaction per country basis on a world heatmap. The corresponding visualization can be found [here](https://i.redd.it/aqcardzlrik51.png).

Another inspiration for us was one of the projects from previous years in this course. In that project, the group visualized the Olympic events in the world throughout the history. They used a world map to display the number of participants from each country. We decided that usage of world map with interesting information results in decent visualizations. The website of that project can be found in [this link](https://com-480-data-visualization.github.io/com-480-project-knn-viz/website/map.html).

Lastly, Covid-19 was among our inspirations due to its psychological effect on people. This led our interests to work with psychology-based data.

We would like to mention that we have never used this dataset in any of our past works before.

## Milestone 2 (7th May, 5pm)

**10% of the final grade**

## Milestone 3 (4th June, 5pm)

**80% of the final grade**

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
