import pandas as pd
import json
from pycountry_convert import country_alpha2_to_country_name

data = pd.read_csv("./data/big_five_scores.csv")
data["sex"] = data["sex"].map({1: "Male", 2: "Female"})
data.rename({'agreeable_score': 'agreeableness',
             'extraversion_score': 'extraversion',
             'openness_score': 'openness',
             'conscientiousness_score': 'conscientiousness',
             'neuroticism_score': 'neuroticism'}, axis='columns', inplace=True)
data = data.dropna(axis=0)
country_map = json.load(open("codes_dict.json", 'r'))
data.country = data.country.map(country_map)
data = data[data.country != '?']
#data.country = data.country.map(lambda x: country_alpha2_to_country_name(x))

data.to_csv("./data/clean_data.csv", index=False)
