"""
Enrich IELTS Vol 1 to Vol 9 vocabulary in Supabase:
1. Example sentence (Method B):
   - Extract from passages.content_en for the corresponding passage.
   - Retain full sentence if <= 30 words.
   - Smart clause extraction or clean 16-26 word window if > 30 words.
   - Suffix and prefix trimming ensuring no dangling prepositions/articles/conjunctions.
   - Flexible matching for inflected hyphenated words, slashes, collocations, and parentheticals.
2. POS (words.pos):
   - Hybrid contextual tagging (Gold standard WordNet + NLTK + Vietnamese meaning markers + morphological suffixes).
   - Standard POS: n, v, adj, adv, phr v, phrase.
3. IPA (words.phonetic):
   - Comprehensive offline IPA engine (in-memory CMU dict, British->American normalization,
     compound splitting, affix derivation, numbers, ellipsis/symbols, and specialized manual overrides).
4. Batch update Supabase:
   - Save intermediate cache to data/ielts_vol_enriched.json.
   - Update Supabase words in batches of 1,000 using bulk_update_words RPC.
"""

import os
import sys
import re
import json
import time
import sqlite3
from collections import defaultdict
import requests
import nltk
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer, PorterStemmer
import eng_to_ipa
import eng_to_ipa.transcribe

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_CACHE = os.path.join(ROOT_DIR, "data", "ielts_vol_parsed_raw.json")
ENRICHED_CACHE = os.path.join(ROOT_DIR, "data", "ielts_vol_enriched.json")

SUPABASE_URL = "https://swehdtrqjyklmsefkjdf.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30."
    "dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU"
)

# ---------------------------------------------------------
# 1. OPTIMIZED OFFLINE CMU DICTIONARY & IPA CONVERSION ENGINE
# ---------------------------------------------------------
print("Loading in-memory CMU dictionary for eng_to_ipa...", flush=True)
t_cmu = time.time()
db_path = os.path.join(os.path.dirname(eng_to_ipa.__file__), "resources", "CMU_dict.db")
conn = sqlite3.connect(db_path)
cmu_dict = defaultdict(list)
for w, p in conn.execute("SELECT word, phonemes FROM dictionary"):
    cmu_dict[w].append(p)
conn.close()

def fast_fetch_words(words_in, db_type="sql"):
    return [(w, cmu_dict[w]) for w in words_in if w in cmu_dict]

eng_to_ipa.transcribe.fetch_words = fast_fetch_words
print(f"CMU dictionary loaded ({len(cmu_dict)} entries) in {time.time() - t_cmu:.2f}s", flush=True)

lem = WordNetLemmatizer()
stemmer = PorterStemmer()

PLACEHOLDERS = {
    "sb": "somebody",
    "sb's": "somebody's",
    "sth": "something",
    "sth's": "something's",
    "sby": "somebody",
    "one's": "one's",
    "sbsth": "somebody or something",
    "nounadj": "noun or adjective"
}

FIXED_IPA = {
    "a": "ə", "an": "ən", "the": "ðə", "of": "əv", "to": "tə", "and": "ən",
    "in": "ɪn", "on": "ɒn", "at": "ət", "for": "fə", "from": "frəm",
    "by": "baɪ", "with": "wɪð", "as": "əz", "or": "ɔː", "than": "ðən", "that": "ðət",
    "bc": "biː siː", "ad": "eɪ diː", "adj": "ˈædʒɪktɪv", "etc": "ɛtˈsɛtərə",
    "cbt": "siː biː tiː", "eg": "iː dʒiː", "eu": "iː juː", "fmri": "ɛf ɛm ɑːr aɪ",
    "gdp": "dʒiː diː piː", "mp": "ɛm piː", "nmr": "ɛn ɛm ɑːr", "otc": "oʊ tiː siː",
    "rd": "ɑːr diː", "scn": "ɛs siː ɛn", "ucla": "juː siː ɛl eɪ", "upc": "juː piː siː",
    "vep": "viː iː piː", "voc": "viː oʊ siː", "ski": "skiː"
}

MANUAL_IPA = {
    "thylacine": "ˈθaɪləsaɪn", "auroch": "ˈɔːrɑk", "aurochs": "ˈɔːrɑks", "banteng": "ˈbæntɛŋ",
    "addax": "ˈædæks", "lactide": "ˈlæktaɪd", "amusia": "eɪˈmjuːziə", "ayurvedic": "ˌaɪʊrˈveɪdɪk",
    "neolithic": "ˌniːəˈlɪθɪk", "radiocarbon": "ˌreɪdioʊˈkɑːrbən", "ethnographical": "ˌɛθnəˈɡræfɪkəl",
    "angkor": "ˈæŋkɔːr", "chilli": "ˈtʃɪli", "chillies": "ˈtʃɪliz", "artefact": "ˈɑːrtəfækt",
    "artefacts": "ˈɑːrtəfækts", "archaeobotanist": "ˌɑːrkioʊˈbɑːtənɪst", "archaism": "ˈɑːrkeɪɪzəm",
    "agrammatical": "ˌeɪɡrəˈmætɪkəl", "agriculturist": "ˌæɡrɪˈkʌltʃərɪst", "albumen": "ælˈbjuːmən",
    "aridity": "əˈrɪdəti", "arithmetical": "ˌærɪθˈmɛtɪkəl", "artisanal": "ɑːrˈtɪzənəl",
    "asphyxiation": "æsˌfɪksiˈeɪʃən", "associative": "əˈsoʊʃieɪtɪv", "astrobiology": "ˌæstroʊbaɪˈɑːlədʒi",
    "attentional": "əˈtɛnʃənəl", "attine": "ˈætɪn", "autonamation": "ˌɔːtəˈmeɪʃən",
    "bathhouse": "ˈbæθhaʊs", "bearskin": "ˈbɛrskɪn", "beeswax": "ˈbiːzwæks",
    "birchbark": "ˈbɜːrtʃbɑːrk", "claypan": "ˈkleɪpæn", "peppercorn": "ˈpɛpərkɔːrn",
    "antechamber": "ˈæntiˌtʃeɪmbər", "aerofoil": "ˈɛrəfɔɪl", "aeroplane": "ˈɛrəpleɪn",
    "aeroplanes": "ˈɛrəpleɪnz", "advert": "ˈædvɜːrt", "adverts": "ˈædvɜːrts",
    "accentuation": "ækˌsɛntʃuˈeɪʃən", "adjudicator": "əˈdʒuːdɪkeɪtər", "acclimatize": "əˈklaɪmətaɪz",
    "acclimatized": "əˈklaɪmətaɪzd", "acclimatization": "əˌklaɪmətəˈzeɪʃən", "beliefassertion": "bɪˈliːf əˈsɜːrʃən",
    "compostable": "kəmˈpoʊstəbəl", "crystallinity": "ˌkrɪstəˈlɪnəti", "desertification": "dɪˌzɜːrtɪfɪˈkeɪʃən",
    "directedness": "dəˈrɛktədnəs", "hatchling": "ˈhætʃlɪŋ", "hatchlings": "ˈhætʃlɪŋz",
    "hygienic": "haɪˈdʒiːnɪk", "inconsiderate": "ˌɪnkənˈsɪdərət", "monoculture": "ˈmɑːnoʊˌkʌltʃər",
    "placeless": "ˈpleɪsləs", "terracotta": "ˌtɛrəˈkɑːtə", "analyse": "ˈænəˌlaɪz",
    "archeologist": "ˌɑːrkiˈɑːlədʒɪst", "behavioural": "bɪˈheɪvjərəl", "benthic": "ˈbɛnθɪk",
    "bichromate": "baɪˈkroʊˌmeɪt", "bicultural": "baɪˈkʌltʃərəl", "biomimetics": "ˌbaɪoʊmɪˈmɛtɪks",
    "biomimetist": "ˌbaɪoʊmɪˈmɛtɪst", "biophilic": "ˌbaɪoʊˈfɪlɪk", "bipedal": "baɪˈpiːdəl",
    "bladderwort": "ˈblædərˌwɜːrt", "bovid": "ˈboʊvɪd", "calorific": "ˌkæləˈrɪfɪk",
    "calve": "kæv", "canadianize": "kəˈneɪdiəˌnaɪz", "candelilla": "ˌkændəˈliːjə",
    "capuchin": "ˈkæpjʊtʃɪn", "cartographer": "kɑːrˈtɑːɡrəfər", "ceresin": "ˈsɛrəsɪn",
    "chalcolithic": "ˌkælkəˈlɪθɪk", "chalky": "ˈtʃɔːki", "chamomile": "ˈkæməˌmaɪl",
    "chronobiologist": "ˌkrɑːnoʊbaɪˈɑːlədʒɪst", "chronobiology": "ˌkrɑːnoʊbaɪˈɑːlədʒi",
    "cingulate": "ˈsɪŋɡjələt", "citrate": "ˈsɪtreɪt", "clime": "klaɪm", "cloven": "ˈkloʊvən",
    "cockerel": "ˈkɑːkərəl", "coevolve": "ˌkoʊɪˈvɑːlv", "conductance": "kənˈdʌktəns",
    "conversazione": "ˌkɑːnvərsætsiˈoʊneɪ", "cookery": "ˈkʊkəri", "coriolis": "ˌkɔːriˈoʊlɪs",
    "corrugation": "ˌkɔːrəˈɡeɪʃən", "cruciferous": "kruːˈsɪfərəs", "culm": "kʌlm",
    "cultivator": "ˈkʌltɪˌveɪtər", "cyanobacterium": "saɪˌænoʊbækˈtɪriəm", "cyanotype": "saɪˈænəˌtaɪp",
    "dabbler": "ˈdæblər", "daguerreotype": "dəˈɡɛroʊˌtaɪp", "debilitation": "dɪˌbɪlɪˈteɪʃən",
    "dendroclimatologist": "ˌdɛndroʊˌklaɪməˈtɑːlədʒɪst", "digitalization": "ˌdɪdʒɪtələˈzeɪʃən",
    "dilettante": "ˌdɪləˈtɑːnt", "diprotodon": "daɪˈproʊtəˌdɑːn", "domicile": "ˈdɑːmɪˌsaɪl",
    "echinoderm": "ɪˈkaɪnoʊˌdɜːrm", "ecocide": "ˈiːkoʊˌsaɪd", "egest": "iːˈdʒɛst",
    "egyptologist": "iːˌdʒɪpˈtɑːlədʒɪst", "eitheror": "ˈiːðər ɔːr", "electroencephalograph": "ɪˌlɛktroʊɛnˌsɛfələˈɡræf",
    "elegiac": "ˌɛlɪˈdʒaɪək", "encasement": "ɪnˈkeɪsmənt", "enrol": "ɛnˈroʊl",
    "eponymous": "ɪˈpɑːnɪməs", "equidistant": "ˌiːkwɪˈdɪstənt", "escapist": "ɪˈskeɪpɪst",
    "ethnobotanist": "ˌɛθnoʊˈbɑːtənɪst", "ethnographer": "ɛθˈnɑːɡrəfər", "ethnologist": "ɛθˈnɑːlədʒɪst",
    "ethnomusicology": "ˌɛθnoʊˌmjuːzɪˈkɑːlədʒi", "eucalypt": "ˈjuːkəlɪpt", "eutrophication": "ˌjuːtrəfɪˈkeɪʃən",
    "evoker": "ɪˈvoʊkər", "exactness": "ɪɡˈzæktnəs", "extractive": "ɪkˈstræktɪv",
    "extremophile": "ɪkˈstrɛməˌfaɪl", "faultless": "ˈfɔːltləs", "ferruginous": "fəˈruːdʒɪnəs",
    "fertiliser": "ˈfɜːrtəˌlaɪzər", "fineness": "ˈfaɪnnəs", "flavanol": "ˈfleɪvənɔːl",
    "fluoridate": "ˈflɔːrɪˌdeɪt", "foetus": "ˈfiːtəs", "folio": "ˈfoʊlioʊ",
    "folklorist": "ˈfoʊkˌlɔːrɪst", "frictional": "ˈfrɪkʃənəl", "fulfil": "fʊlˈfɪl",
    "fulmar": "ˈfʊlmər", "futurology": "ˌfjuːtʃəˈrɑːlədʒi", "galah": "ɡəˈlɑː",
    "gamification": "ˌɡeɪmɪfɪˈkeɪʃən", "gaur": "ɡaʊər", "geomorphologist": "ˌdʒiːoʊmɔːrˈfɑːlədʒɪst",
    "geophagy": "dʒiˈɑːfədʒi", "goanna": "ɡoʊˈænə", "goby": "ˈɡoʊbi", "gustducin": "ɡʌstˈdjuːsɪn",
    "haemoglobin": "ˈhiːməˌɡloʊbɪn", "haplology": "hæˈplɑːlədʒi", "hemispherical": "ˌhɛmɪˈsfɪrɪkəl",
    "heritability": "ˌhɛrɪtəˈbɪləti", "hoaxer": "ˈhoʊksər", "huhu": "ˈhuːhuː",
    "hypothalamus": "ˌhaɪpoʊˈθæləməs", "hypoxic": "haɪˈpɑːksɪk", "ichnotaxa": "ˌɪknoʊˈtæksə",
    "impasto": "ɪmˈpæstoʊ", "impermeable": "ɪmˈpɜːrmiəbəl", "inattentional": "ˌɪnəˈtɛnʃənəl",
    "inbox": "ˈɪnˌbɑːks", "inbuilt": "ˈɪnˌbɪlt", "incomprehension": "ɪnˌkɑːmprɪˈhɛnʃən",
    "instantaneousness": "ˌɪnstənˈteɪniəsnəs", "internalization": "ɪnˌtɜːrnələˈzeɪʃən",
    "interruptibility": "ˌɪntəˌrʌptəˈbɪləti", "intrapreneurship": "ˌɪntrəprəˈnɜːrʃɪp",
    "inverter": "ɪnˈvɜːrtər", "iridescence": "ˌɪrɪˈdɛsəns", "kaolinite": "ˈkeɪəlɪˌnaɪt",
    "labourer": "ˈleɪbərər", "lechwe": "ˈlɛtʃwi", "linguistique": "lɛ̃ɡwisˈtik",
    "localness": "ˈloʊkəlnəs", "locule": "ˈlɑːkjuːl", "lorikeet": "ˈlɔːrɪˌkiːt",
    "macrosmatic": "ˌmækroʊzˈmætɪk", "magnificence": "mæɡˈnɪfɪsəns", "maireener": "meɪˈriːnər",
    "malariologist": "məˌlɛriˈɑːlədʒɪst", "malignity": "məˈlɪɡnəti", "masticate": "ˈmæstɪˌkeɪt",
    "mediaeval": "ˌmiːdiˈiːvəl", "memorization": "ˌmɛmərəˈzeɪʃən", "mercaptan": "mɜːrˈkæptæn",
    "mimesis": "mɪˈmiːsɪs", "minimization": "ˌmɪnɪməˈzeɪʃən", "mollusc": "ˈmɑːləsk",
    "mu": "mjuː", "mung": "mʌŋ", "museology": "ˌmjuːziˈɑːlədʒi", "mutability": "ˌmjuːtəˈbɪləti",
    "mynah": "ˈmaɪnə", "naringin": "nəˈrɪndʒɪn", "naturalness": "ˈnætʃərəlnəs",
    "neanderthaler": "niˈændərˌtɑːlər", "nearness": "ˈnɪrnəs", "neem": "niːm",
    "nocebo": "noʊˈsiːboʊ", "novelette": "ˌnɑːvəˈlɛt", "nutriment": "ˈnuːtrɪmənt",
    "oaf": "oʊf", "obelisk": "ˈɑːbəlɪsk", "odontocete": "oʊˈdɑːntəˌsiːt",
    "olfaction": "ɑːlˈfækʃən", "omelette": "ˈɑːmlət", "organisational": "ˌɔːrɡənəˈzeɪʃənəl",
    "ornithologist": "ˌɔːrnɪˈθɑːlədʒɪst", "ove": "ˈoʊv", "ozokerite": "oʊˈzoʊkəˌraɪt",
    "paediatric": "ˌpiːdiˈætrɪk", "palaeoanthropologist": "ˌpeɪlioʊˌænθrəˈpɑːlədʒɪst",
    "palaeolithic": "ˌpeɪliəˈlɪθɪk", "palaeontologist": "ˌpeɪliɑːnˈtɑːlədʒɪst",
    "palynologist": "ˌpælɪˈnɑːlədʒɪst", "panchayat": "pʌnˈtʃɑːjət", "papyrus": "pəˈpaɪrəs",
    "passionless": "ˈpæʃənləs", "patchiness": "ˈpætʃinəs", "perfumer": "pərˈfjuːmər",
    "perfumery": "pərˈfjuːməri", "phenylthiocarbamide": "ˌfɛnəlˌθaɪoʊˈkɑːrbəmaɪd",
    "phytochemical": "ˌfaɪtoʊˈkɛmɪkəl", "plectrum": "ˈplɛktrəm", "poisoner": "ˈpɔɪzənər",
    "polysomnogram": "ˌpɑːliˈsɑːmnəˌɡræm", "porosity": "pɔːˈrɑːsəti", "prickle": "ˈprɪkəl",
    "primatologist": "ˌpraɪməˈtɑːlədʒɪst", "prosopagnosia": "ˌprɑːsoʊpæɡˈnoʊziə",
    "prosopagnosic": "ˌprɑːsoʊpæɡˈnoʊzɪk", "pteroid": "ˈtɛrɔɪd", "pterosaur": "ˈtɛrəˌsɔːr",
    "puku": "ˈpuːkuː", "pyjamas": "pəˈdʒɑːməz", "raditional": "trəˈdɪʃənəl",
    "reanalyse": "ˌriːˈænəˌlaɪz", "reciprocation": "rɪˌsɪprəˈkeɪʃən", "recognisable": "ˈrɛkəɡˌnaɪzəbəl",
    "recolonize": "riːˈkɑːləˌnaɪz", "recursion": "rɪˈkɜːrʒən", "recursive": "rɪˈkɜːrsɪv",
    "reflood": "riːˈflʌd", "relaxer": "rɪˈlæksər", "repopulate": "riːˈpɑːpjəˌleɪt",
    "resonator": "ˈrɛzəˌneɪtər", "rizatriptan": "ˌraɪzəˈtrɪptæn", "rovide": "prəˈvaɪd",
    "sanatorium": "ˌsænəˈtɔːriəm", "sawn": "sɔːn", "scarab": "ˈskærəb",
    "sceptic": "ˈskɛptɪk", "sceptical": "ˈskɛptɪkəl", "sedimentological": "ˌsɛdəmɛntəˈlɑːdʒɪkəl",
    "semaphore": "ˈsɛməˌfɔːr", "signifier": "ˈsɪɡnɪˌfaɪər", "sitatunga": "ˌsɪtəˈtʊŋɡə",
    "skilful": "ˈskɪlfəl", "skink": "skɪŋk", "sleeplessness": "ˈsliːpləsnəs",
    "snorkeler": "ˈsnɔːrkələr", "sociability": "ˌsoʊʃəˈbɪləti", "speediest": "ˈspiːdiəst",
    "spicier": "ˈspaɪsiər", "spinneret": "ˈspɪnəˌrɛt", "splutter": "ˈsplʌtər",
    "stickiness": "ˈstɪkinəs", "stoat": "stoʊt", "stratification": "ˌstrætəfəˈkeɪʃən",
    "stretchy": "ˈstrɛtʃi", "succinite": "ˈsʌksəˌnaɪt", "sumerian": "suːˈmɛriən",
    "suprachiasmatic": "ˌsuːprəˌkaɪəzˈmætɪk", "surimono": "ˌsʊriˈmoʊnoʊ",
    "synaesthesia": "ˌsɪnəsˈθiːziə", "synaptic": "sɪˈnæptɪk", "synchrony": "ˈsɪŋkrəni",
    "synesthesia": "ˌsɪnəsˈθiːziə", "synesthete": "ˈsɪnəsˌθiːt", "syrupy": "ˈsɪrəpi",
    "tahr": "tɑːr", "tastant": "ˈteɪstənt", "taxonomy": "tækˈsɑːnəmi", "telegraphy": "təˈlɛɡrəfi",
    "terpene": "ˈtɜːrpiːn", "tinnitus": "tɪˈnaɪtəs", "tranquilliser": "ˈtræŋkwəˌlaɪzər",
    "trilingual": "traɪˈlɪŋɡwəl", "tussock": "ˈtʌsək", "typicality": "ˌtɪpɪˈkæləti",
    "umami": "uːˈmɑːmi", "uncommunicative": "ˌʌnkəˈmjuːnɪkətɪv", "uncreative": "ˌʌnkriˈeɪtɪv",
    "ungracious": "ʌnˈɡreɪʃəs", "unimportance": "ˌʌnɪmˈpɔːrtəns", "unintelligent": "ˌʌnɪnˈtɛlədʒənt",
    "unproblematic": "ˌʌnˌprɑːbləˈmætɪk", "unrecognisable": "ˌʌnˈrɛkəɡˌnaɪzəbəl",
    "unripe": "ʌnˈraɪp", "unteachable": "ʌnˈtiːtʃəbəl", "vellum": "ˈvɛləm",
    "ventrolateral": "ˌvɛntroʊˈlætərəl", "vinaigrette": "ˌvɪnəˈɡrɛt", "waggle": "ˈwæɡəl",
    "wakeful": "ˈweɪkfəl", "wakefulness": "ˈweɪkfəlnəs", "wastage": "ˈweɪstɪdʒ",
    "dartiste": "dɑːrˈtiːst"
}

def british_to_american(word):
    w = word
    w = re.sub(r'([a-z]{2,})y([a-z]*)ise$', r'\1y\2ize', w)
    w = re.sub(r'([a-z]{3,})ise$', r'\1ize', w)
    w = re.sub(r'([a-z]{3,})ises$', r'\1izes', w)
    w = re.sub(r'([a-z]{3,})ised$', r'\1ized', w)
    w = re.sub(r'([a-z]{3,})ising$', r'\1izing', w)
    w = re.sub(r'([a-z]{3,})isation$', r'\1ization', w)
    w = re.sub(r'([a-z]{3,})isations$', r'\1izations', w)
    w = re.sub(r'([a-z]{3,})isable$', r'\1izable', w)
    w = re.sub(r'([a-z]{2,})our$', r'\1or', w)
    w = re.sub(r'([a-z]{2,})ours$', r'\1ors', w)
    w = re.sub(r'([a-z]{2,})oured$', r'\1ored', w)
    w = re.sub(r'([a-z]{2,})ouring$', r'\1oring', w)
    w = re.sub(r'([a-z]{2,})ourful$', r'\1orful', w)
    w = re.sub(r'([a-z]{2,})ourless$', r'\1orless', w)
    w = re.sub(r'([a-z]{2,})oural$', r'\1oral', w)
    w = re.sub(r'([a-z]{2,})ourer$', r'\1orer', w)
    w = re.sub(r'([a-z]{2,})ourers$', r'\1orers', w)
    w = re.sub(r'([a-z]{2,}[bcdfghjklmnpqrstvwxz])re$', r'\1er', w)
    w = re.sub(r'([a-z]{2,}[bcdfghjklmnpqrstvwxz])res$', r'\1ers', w)
    if w in ('defence', 'offence', 'pretence', 'licence'):
        w = w[:-2] + 'se'
    w = w.replace('archaeo', 'archeo').replace('artefact', 'artifact').replace('paedia', 'pedia').replace('palaeo', 'paleo')
    w = re.sub(r'([a-z]{2,}[aeiou])ll(ed|ing|er|ers)$', r'\1l\2', w)
    return w

def try_compound_split(tok):
    if len(tok) < 6:
        return None
    for split_pt in range(3, len(tok) - 2):
        w1 = tok[:split_pt]
        w2 = tok[split_pt:]
        if w1 in cmu_dict and w2 in cmu_dict:
            res1 = eng_to_ipa.convert(w1)
            res2 = eng_to_ipa.convert(w2)
            if not res1.endswith("*") and not res2.endswith("*"):
                return f"{res1} {res2}"
    return None

def try_affix_derivation(tok):
    if tok.endswith("ness") and len(tok) > 6:
        stem = tok[:-4]
        if stem.endswith("i"): stem = stem[:-1] + "y"
        res = eng_to_ipa.convert(stem)
        if not res.endswith("*"): return f"{res}nəs"
    if tok.endswith("less") and len(tok) > 6:
        stem = tok[:-4]
        res = eng_to_ipa.convert(stem)
        if not res.endswith("*"): return f"{res}ləs"
    if tok.endswith("able") and len(tok) > 6:
        stem = tok[:-4]
        res = eng_to_ipa.convert(stem)
        if not res.endswith("*"): return f"{res}əbəl"
    if tok.endswith("ist") and len(tok) > 5:
        stem = tok[:-3]
        res = eng_to_ipa.convert(stem)
        if not res.endswith("*"): return f"{res}ɪst"
    if tok.endswith("ation") and len(tok) > 7:
        stem = tok[:-5]
        res = eng_to_ipa.convert(stem)
        if not res.endswith("*"): return f"{res}ˈeɪʃən"

    for pref, pref_ipa in [
        ("anti", "ˌænti"), ("non", "nɑn"), ("pre", "pri"), ("post", "poʊst"),
        ("sub", "sʌb"), ("micro", "ˈmaɪkroʊ"), ("macro", "ˈmækroʊ"),
        ("bio", "ˈbaɪoʊ"), ("socio", "ˈsoʊʃioʊ"), ("inter", "ˌɪntər"),
        ("intra", "ˌɪntrə"), ("super", "ˈsupər"), ("semi", "ˈsɛmi"),
        ("un", "ʌn"), ("re", "ri")
    ]:
        if tok.startswith(pref) and len(tok) > len(pref) + 2:
            stem = tok[len(pref):]
            res = eng_to_ipa.convert(stem)
            if not res.endswith("*"): return f"{pref_ipa} {res}"
    return None

NUMBER_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
    "10": "ten", "15": "fifteen", "24": "twenty four", "35": "thirty five",
    "48": "forty eight", "500": "five hundred", "1950": "nineteen fifty",
    "10000": "ten thousand", "10,000": "ten thousand"
}

ipa_cache = {}

def get_word_ipa(tok):
    clean = re.sub(r"[^A-Za-z'’-]", "", tok).lower().replace("’", "'")
    if not clean:
        # Check if number
        num_clean = tok.strip().replace(",", "")
        if num_clean in NUMBER_WORDS:
            val = " ".join(get_word_ipa(p) for p in NUMBER_WORDS[num_clean].split())
            return val
        return ""
        
    if clean in ipa_cache:
        return ipa_cache[clean]

    if clean in PLACEHOLDERS:
        tok_lookup = PLACEHOLDERS[clean]
        if " " in tok_lookup:
            res = " ".join(get_word_ipa(w) for w in tok_lookup.split())
            ipa_cache[clean] = res
            return res
        clean = tok_lookup

    if clean in FIXED_IPA:
        val = FIXED_IPA[clean]
        ipa_cache[clean] = val
        return val

    if clean in MANUAL_IPA:
        val = MANUAL_IPA[clean]
        ipa_cache[clean] = val
        return val

    # Grammar abbreviations
    if clean in ('v', 'v1', 'v2'):
        return "viː"
    if clean == 'v3':
        return "viː θriː"
    if clean == 'ving':
        return "viː ɪŋ"

    if "-" in clean:
        sub_parts = [get_word_ipa(p) for p in clean.split("-") if p]
        val = "-".join(p for p in sub_parts if p)
        ipa_cache[clean] = val
        return val

    res = eng_to_ipa.convert(clean)
    if not res.endswith("*"):
        ipa_cache[clean] = res
        return res

    am = british_to_american(clean)
    if am != clean:
        res = eng_to_ipa.convert(am)
        if not res.endswith("*"):
            ipa_cache[clean] = res
            return res

    if clean.endswith("s") and len(clean) > 3:
        sub = get_word_ipa(clean[:-1])
        if sub and not sub.endswith("*"):
            val = sub + "s"
            ipa_cache[clean] = val
            return val
    if clean.endswith("ed") and len(clean) > 4:
        sub = get_word_ipa(clean[:-2])
        if sub and not sub.endswith("*"):
            val = sub + "d"
            ipa_cache[clean] = val
            return val
    if clean.endswith("ing") and len(clean) > 5:
        sub = get_word_ipa(clean[:-3])
        if sub and not sub.endswith("*"):
            val = sub + "ɪŋ"
            ipa_cache[clean] = val
            return val
    if clean.endswith("ly") and len(clean) > 4:
        sub = get_word_ipa(clean[:-2])
        if sub and not sub.endswith("*"):
            val = sub + "li"
            ipa_cache[clean] = val
            return val

    comp = try_compound_split(clean)
    if comp:
        ipa_cache[clean] = comp
        return comp

    aff = try_affix_derivation(clean)
    if aff:
        ipa_cache[clean] = aff
        return aff

    val = res.rstrip("*")
    ipa_cache[clean] = val
    return val

def convert_to_ipa(phrase):
    # Normalize punctuation tokens
    p_norm = phrase.replace("...", " ").replace("…", " ").replace("/", " ").replace("+", " ")
    tokens = p_norm.strip().split()
    parts = [get_word_ipa(t) for t in tokens]
    parts = [p for p in parts if p]
    if not parts:
        return ""
    return f"/{' '.join(parts)}/"

# ---------------------------------------------------------
# 2. HYBRID POS CLASSIFIER (GOLD STANDARD WORDNET + NLTK)
# ---------------------------------------------------------
PREPOSITIONS = {
    'in', 'on', 'at', 'up', 'down', 'out', 'off', 'away', 'over', 'into', 'to',
    'about', 'with', 'for', 'from', 'through', 'across', 'after', 'against', 'by',
    'around', 'back', 'along', 'under', 'ahead', 'apart', 'aside', 'upon'
}

NOUN_VN_PREFIXES = (
    'sự ', 'việc ', 'người ', 'nhà ', 'cây ', 'con ', 'loài ', 'cái ', 'chiếc ',
    'cuộc ', 'quá trình ', 'khả năng ', 'tình trạng ', 'khu vực ', 'vùng ', 'nơi ',
    'vấn đề ', 'hệ thống ', 'phương pháp ', 'cách thức ', 'chất ', 'nguồn ', 'thời kỳ ',
    'giai đoạn ', 'mức độ ', 'lợi ích ', 'hậu quả ', 'kết quả ', 'bằng chứng ',
    'nghiên cứu ', 'hiện tượng ', 'cấu trúc ', 'hình dạng ', 'đặc điểm ', 'tính chất ',
    'bộ phận ', 'ngành ', 'lĩnh vực ', 'thiết bị ', 'dụng cụ ', 'tiền ', 'thuế ', 'vải ',
    'đất ', 'rừng ', 'đá ', 'nước ', 'khí ', 'thức ăn ', 'thực phẩm ', 'động vật ', 'thực vật ',
    'lòng ', 'niềm ', 'cảm giác ', 'sự ', 'tính '
)

VERB_VN_PREFIXES = (
    'được ', 'bị ', 'làm ', 'gây ', 'tạo ', 'trở nên ', 'phát triển ', 'tăng ', 'giảm ',
    'thay đổi ', 'chuyển ', 'mang ', 'cho phép ', 'ngăn ', 'bảo vệ ', 'giữ ', 'duy trì ',
    'cung cấp ', 'yêu cầu ', 'sử dụng ', 'tham gia ', 'ảnh hưởng ', 'tác động ', 'đối mặt ',
    'tìm ', 'thực hiện ', 'đóng góp ', 'phục vụ ', 'kết hợp ', 'giúp ', 'chứng minh ',
    'chỉ ra ', 'mô tả ', 'thảo luận ', 'giải thích ', 'xem xét ', 'đánh giá ', 'sống sót ',
    'thích nghi ', 'tiếp cận ', 'khiến ', 'đạt được ', 'tránh ', 'hạn chế ', 'loại bỏ ',
    'tiếp tục ', 'bắt đầu ', 'kết thúc ', 'đặt ', 'đốt ', 'lấp ', 'hưởng ', 'ngừng ',
    'chấm dứt ', 'sản xuất ', 'chấp nhận '
)

ADJ_VN_PREFIXES = (
    'thuộc ', 'có tính ', 'mang tính ', 'đặc trưng ', 'khác biệt ', 'quan trọng ',
    'tự nhiên ', 'rõ ràng ', 'phù hợp ', 'chính xác ', 'hiệu quả ', 'dễ ', 'khó ',
    'lớn ', 'nhỏ ', 'cao ', 'thấp ', 'mới ', 'cũ ', 'cổ ', 'nhanh ', 'chậm ',
    'mạnh ', 'yếu ', 'tương tự ', 'nguy hiểm ', 'phức tạp ', 'đơn giản ', 'chủ yếu ',
    'chính ', 'phụ ', 'đầy đủ ', 'khan hiếm ', 'phổ biến ', 'hiếm ', 'giống ',
    'cụ thể ', 'đặc biệt ', 'thân thiện '
)

ADV_VN_PREFIXES = (
    'một cách ', 'đáng kể ', 'hoàn toàn ', 'chủ yếu ', 'đặc biệt ', 'thường ', 'luôn ',
    'gần như ', 'tương đối ', 'cực kỳ ', 'vô cùng ', 'ngay lập tức ', 'dần dần ', 'cuối cùng '
)

NOUN_SUFFIX_VERB_EXCEPTIONS = {
    'implement', 'lament', 'comment', 'mention', 'witness', 'harness',
    'experiment', 'function', 'segment', 'fragment', 'document', 'supplement'
}

ADJ_SUFFIX_NOUN_EXCEPTIONS = {
    'animal', 'hospital', 'official', 'individual', 'material', 'chemical',
    'fossil', 'signal', 'festival', 'capital', 'journal', 'mineral', 'cereal',
    'interval', 'pedal', 'rival', 'oval', 'survival', 'arrival', 'removal', 'proposal',
    'approval', 'dismissal', 'initiative', 'alternative', 'representative', 'executive',
    'incentive', 'perspective', 'objective', 'directive', 'narrative', 'motive'
}

VERB_SUFFIX_NOUN_ADJ_EXCEPTIONS = {
    'climate', 'estate', 'senate', 'delicate', 'accurate', 'private', 'adequate',
    'ultimate', 'intricate', 'desperate', 'passionate', 'certificate', 'candidate',
    'surrogate', 'chocolate', 'pirate', 'temperate', 'immediate', 'approximate',
    'separate', 'moderate', 'elaborate', 'literate', 'illiterate', 'legitimate'
}

wn_cache = {}
def get_wn_poses(word):
    w = word.lower()
    if w not in wn_cache:
        wn_cache[w] = {s.pos() for s in wn.synsets(w)}
    return wn_cache[w]

def determine_pos(word_text, meaning, contextual_tag=None):
    word = word_text.strip().lower()
    meaning_lower = meaning.strip().lower()
    tokens = word.split()

    # 1. Multi-word phrases
    if len(tokens) > 1:
        if 2 <= len(tokens) <= 3:
            first_tok = tokens[0]
            second_tok = tokens[1]
            first_poses = get_wn_poses(first_tok)
            if first_tok not in ('in', 'on', 'at', 'by', 'for', 'with', 'under', 'over', 'from', 'into', 'as', 'to', 'the', 'a', 'an'):
                if second_tok in PREPOSITIONS and ('v' in first_poses or first_tok in ('take', 'get', 'give', 'make', 'put', 'come', 'go', 'turn', 'bring', 'keep', 'look', 'call', 'run', 'fall', 'set', 'pick', 'carry', 'hold')):
                    if not any(meaning_lower.startswith(p) for p in NOUN_VN_PREFIXES):
                        return "phr v"
        return "phrase"

    # 2. Single word: Suffix rules
    if word.endswith(('friendly', '-friendly')):
        return "adj"

    if word.endswith('ly'):
        if word in ('early', 'friendly', 'lovely', 'ugly', 'silly', 'lonely', 'costly', 'orderly', 'deadly', 'lively', 'timely', 'scholarly'):
            return "adj"
        return "adv"

    if word.endswith(('tion', 'sion', 'ment', 'ness', 'ity', 'ance', 'ence', 'ship', 'hood', 'ist', 'ism')):
        if word not in NOUN_SUFFIX_VERB_EXCEPTIONS:
            return "n"

    if word.endswith(('able', 'ible', 'al', 'ful', 'less', 'ous', 'ic', 'ive', 'ish')):
        if word not in ADJ_SUFFIX_NOUN_EXCEPTIONS:
            return "adj"

    if word.endswith(('ize', 'ise', 'ify', 'ate')):
        if word not in VERB_SUFFIX_NOUN_ADJ_EXCEPTIONS:
            if 'v' in get_wn_poses(word):
                return "v"

    # 3. Contextual tag parsing
    ctx_pos = None
    if contextual_tag:
        if contextual_tag.startswith('NN'):
            ctx_pos = 'n'
        elif contextual_tag.startswith('VB'):
            ctx_pos = 'v'
        elif contextual_tag.startswith('JJ'):
            ctx_pos = 'adj'
        elif contextual_tag.startswith('RB') or contextual_tag.startswith('WRB'):
            ctx_pos = 'adv'

    wn_poses = get_wn_poses(word)
    has_n = 'n' in wn_poses
    has_v = 'v' in wn_poses
    has_adj = bool(wn_poses & {'a', 's'})
    has_adv = 'r' in wn_poses

    # 4. Unambiguous WordNet class (Gold Standard)
    if wn_poses:
        if has_n and not (has_v or has_adj or has_adv): return "n"
        if has_v and not (has_n or has_adj or has_adv): return "v"
        if has_adj and not (has_n or has_v or has_adv): return "adj"
        if has_adv and not (has_n or has_v or has_adj): return "adv"

    # 5. Ambiguous words: Vietnamese meaning disambiguation
    vn_is_v = any(meaning_lower.startswith(p) for p in VERB_VN_PREFIXES)
    vn_is_n = any(meaning_lower.startswith(p) for p in NOUN_VN_PREFIXES)
    vn_is_adj = any(meaning_lower.startswith(p) for p in ADJ_VN_PREFIXES)
    vn_is_adv = any(meaning_lower.startswith(p) for p in ADV_VN_PREFIXES)

    if vn_is_v and (has_v or not wn_poses): return "v"
    if vn_is_n and (has_n or not wn_poses): return "n"
    if vn_is_adj and (has_adj or not wn_poses): return "adj"
    if vn_is_adv and (has_adv or not wn_poses): return "adv"

    # 6. Contextual tag agreement
    if ctx_pos == 'n' and has_n: return "n"
    if ctx_pos == 'v' and has_v: return "v"
    if ctx_pos == 'adj' and has_adj: return "adj"
    if ctx_pos == 'adv' and has_adv: return "adv"

    if ctx_pos and (ctx_pos in wn_poses or not wn_poses):
        return ctx_pos

    if vn_is_v: return "v"
    if vn_is_n: return "n"
    if vn_is_adj: return "adj"
    if vn_is_adv: return "adv"

    if has_v: return "v"
    if has_adj: return "adj"
    if has_adv: return "adv"

    return "n"

# ---------------------------------------------------------
# 3. FAST SENTENCE STRUCTURE & ADVANCED PASSAGE MATCHER
# ---------------------------------------------------------
class FastSentence:
    __slots__ = (
        's_idx', 'raw_text', 'clean_text', 'words_list', 'tokens',
        'lemmas_set', 'lemmas_list', 'stems_list', 'stems_set', 'pos_tags'
    )
    def __init__(self, raw_text, s_idx):
        self.s_idx = s_idx
        self.raw_text = raw_text
        self.clean_text = re.sub(r'\s+', ' ', raw_text).strip()
        self.words_list = self.clean_text.split()
        self.tokens = [t.lower() for t in nltk.word_tokenize(self.clean_text)]
        self.pos_tags = nltk.pos_tag(self.tokens) if self.tokens else []
        l_set = set()
        l_list = []
        s_list = []
        s_set = set()
        for tok, tag in self.pos_tags:
            w_norm = re.sub(r"[^a-zA-Z0-9'-]", "", tok.lower())
            if w_norm:
                pos_lemmas = {lem.lemmatize(w_norm, p) for p in ('n', 'v', 'a', 'r')} | {w_norm}
                st = stemmer.stem(w_norm)
                l_set.update(pos_lemmas)
                l_list.append(pos_lemmas)
                s_list.append(st)
                s_set.add(st)
            else:
                l_list.append({tok.lower()})
                s_list.append(tok.lower())
        self.lemmas_set = l_set
        self.lemmas_list = l_list
        self.stems_list = s_list
        self.stems_set = s_set

def build_regex_patterns(word_text):
    w = word_text.strip().lower().replace("’", "'")
    patterns = []
    
    variants = [w]
    if "/" in w:
        variants.extend([p.strip() for p in w.split("/") if p.strip()])
    if "(" in w:
        variants.append(re.sub(r'\(.*?\)', '', w).strip())
        variants.append(re.sub(r'[\(\)]', '', w).strip())
        
    for v in set(variants):
        if not v: continue
        clean_v = re.sub(r"\b(?:sb|sth|one's|someone|something|\.\.\.|…)\b", "", v)
        clean_v = re.sub(r'\s+', ' ', clean_v).strip()
        
        for cand in set([v, clean_v]):
            if not cand: continue
            pat = re.escape(cand)
            pat = re.sub(r'\\ ', r'\\s+', pat)
            pat = re.sub(r'\\-', r'[-\\s]+', pat)
            pat = pat.replace(r"one\'s", r"(?:one's|its|their|his|her|my|our|your|\w+'s)")
            pat = pat.replace(r"sb\'s", r"(?:somebody's|someone's|\w+'s)")
            pat = pat.replace(r"sb", r"(?:somebody|someone|\w+)")
            pat = pat.replace(r"sth", r"(?:something|\w+)")
            
            # Match exact or with common inflections on final token (-s, -ed, -ing, -d, -er, -est)
            rgx_exact = re.compile(r'\b' + pat + r'\b', re.I)
            rgx_inflect = re.compile(r'\b' + pat + r'(?:s|es|ed|d|ing|er|est|ly)?\b', re.I)
            patterns.append((rgx_exact, 1))
            patterns.append((rgx_inflect, 2))
            
    return patterns

def match_word_in_passage(word_text, sents):
    if not sents:
        return None, None

    # Tier 1: Exact & inflected regex
    patterns = build_regex_patterns(word_text)
    for rgx, prio in sorted(patterns, key=lambda x: x[1]):
        for fs in sents:
            m = rgx.search(fs.clean_text)
            if m:
                return fs, get_token_tag_at_pos(fs, m.group(0))

    tgt_tokens = [t.lower() for t in nltk.word_tokenize(word_text.replace("-", " ")) if t not in "'-/()...…"]
    if not tgt_tokens:
        return None, None
    t_len = len(tgt_tokens)

    # Tier 2: Single token lemma / stem
    if t_len == 1:
        tok = tgt_tokens[0]
        tok_lem = {lem.lemmatize(tok, pos) for pos in ('n', 'v', 'a', 'r')} | {tok}
        tok_st = stemmer.stem(tok)
        for fs in sents:
            if tok_lem & fs.lemmas_set:
                tag = get_token_tag_by_lemma(fs, tok_lem)
                return fs, tag
        if len(tok_st) >= 4:
            for fs in sents:
                if tok_st in fs.stems_set:
                    tag = get_token_tag_by_stem(fs, tok_st)
                    return fs, tag
        return None, None

    # Tier 3: Multi-word sequence match with lemma
    tgt_lemmas = []
    for t in tgt_tokens:
        if t in ("one's", "sb", "sth", "someone", "something"):
            tgt_lemmas.append(None)
        else:
            tgt_lemmas.append({lem.lemmatize(t, pos) for pos in ('n', 'v', 'a', 'r')} | {t})

    for fs in sents:
        s_len = len(fs.tokens)
        for i in range(s_len - t_len + 1):
            match = True
            for k in range(t_len):
                if tgt_lemmas[k] is None:
                    continue
                if not (tgt_lemmas[k] & fs.lemmas_list[i + k]):
                    match = False
                    break
            if match:
                return fs, fs.pos_tags[i][1] if i < len(fs.pos_tags) else None

    # Tier 4: Collocation with intervening words
    first_lem = tgt_lemmas[0]
    last_lem = tgt_lemmas[-1]
    if first_lem and last_lem:
        for fs in sents:
            if (first_lem & fs.lemmas_set) and (last_lem & fs.lemmas_set):
                first_pos = [i for i, l in enumerate(fs.lemmas_list) if l & first_lem]
                last_pos = [i for i, l in enumerate(fs.lemmas_list) if l & last_lem]
                for p1 in first_pos:
                    for p2 in last_pos:
                        if 0 < p2 - p1 <= t_len + 4:
                            return fs, fs.pos_tags[p1][1] if p1 < len(fs.pos_tags) else None

    # Tier 5: Key content word of phrase
    content_tokens = [t for t in tgt_tokens if t not in ('a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'as')]
    if content_tokens:
        best_tok = max(content_tokens, key=len)
        if len(best_tok) >= 4:
            b_lem = {lem.lemmatize(best_tok, pos) for pos in ('n', 'v', 'a', 'r')} | {best_tok}
            for fs in sents:
                if b_lem & fs.lemmas_set:
                    tag = get_token_tag_by_lemma(fs, b_lem)
                    return fs, tag

    return None, None

def get_token_tag_at_pos(fs, match_str):
    m_tok = match_str.split()[0].lower()
    for tok, tag in fs.pos_tags:
        if tok == m_tok:
            return tag
    return None

def get_token_tag_by_lemma(fs, lemma_set):
    for i, l in enumerate(fs.lemmas_list):
        if l & lemma_set:
            if i < len(fs.pos_tags):
                return fs.pos_tags[i][1]
    return None

def get_token_tag_by_stem(fs, st):
    for i, s in enumerate(fs.stems_list):
        if s == st:
            if i < len(fs.pos_tags):
                return fs.pos_tags[i][1]
    return None

# ---------------------------------------------------------
# 4. METHOD B EXAMPLE SENTENCE FORMATTER (ZERO DANGLING)
# ---------------------------------------------------------
DANGLING_STOPS = {
    'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'as',
    'and', 'or', 'but', 'nor', 'yet', 'that', 'which', 'who', 'whom',
    'whose', 'than', 'from', 'into'
}

LEADING_TRIM = re.compile(
    r'^(?:and|but|or|so|yet|because|since|although|while|whereas|however|moreover|furthermore|therefore|thus)\b\s*[,;]?\s*',
    re.I
)

CLAUSE_DELIMS = re.compile(
    r'(?:;\s*|—\s*|--\s*|:\s*|,\s+(?=and\b|but\b|although\b|while\b|whereas\b|because\b|since\b|however\b|so\b|yet\b|which\b|where\b|who\b|when\b))',
    re.I
)

def trim_dangling(s):
    if not s:
        return ""
    # Check if phrase ends with idiomatic 'so on'
    s_test = s.rstrip(' .?!,;:-"\'')
    if s_test.lower().endswith("and so on") or s_test.lower().endswith("or so on"):
        s = s_test
    else:
        # Strip dangling trailing stop words
        while True:
            s_clean = s.rstrip(' .?!,;:-"\'')
            tokens = s_clean.split()
            if not tokens:
                return ""
            last_tok = re.sub(r"[^a-zA-Z]", "", tokens[-1]).lower()
            if last_tok in DANGLING_STOPS and len(tokens) > 2:
                s = ' '.join(tokens[:-1])
            else:
                break
            
    s = s.rstrip(' ,;:-"\'')
    if not s:
        return ""
    s = LEADING_TRIM.sub('', s).strip()
    if not s:
        return ""
    s = s[0].upper() + s[1:]
    if not s.endswith(('.', '?', '!')):
        s = s.rstrip(' ,;:-') + '.'
    return s

def format_example_sentence(raw_sentence, target_word):
    s = re.sub(r'\s+', ' ', raw_sentence).strip()
    words = s.split()
    total_w = len(words)

    # Method B Rule 1: sentence <= 30 words -> retain full sentence
    if total_w <= 30:
        if not s:
            return ""
        s = re.sub(r'\s+[A-Z]\.$', '.', s)
        s = s[0].upper() + s[1:]
        if not s.endswith(('.', '?', '!')):
            s = s.rstrip(' ,;:-') + '.'
        return s

    # Method B Rule 2: sentence > 30 words -> smart clause extraction
    tgt_clean = re.sub(r"[^A-Za-z0-9\s]", "", target_word.lower()).strip()
    tgt_tokens = [t for t in tgt_clean.split() if len(t) >= 3]
    if not tgt_tokens:
        tgt_tokens = tgt_clean.split()

    clauses = CLAUSE_DELIMS.split(s)
    if len(clauses) > 1:
        for cl in clauses:
            cl_clean = re.sub(r'\s+', ' ', cl).strip()
            cl_words = cl_clean.split()
            cl_norm = re.sub(r"[^A-Za-z0-9\s]", "", cl_clean.lower())
            if any(t in cl_norm.split() for t in tgt_tokens):
                if 12 <= len(cl_words) <= 30:
                    cand = trim_dangling(cl_clean)
                    if cand and len(cand.split()) >= 8:
                        return cand

        for i, cl in enumerate(clauses):
            cl_clean = re.sub(r'\s+', ' ', cl).strip()
            cl_norm = re.sub(r"[^A-Za-z0-9\s]", "", cl_clean.lower())
            if any(t in cl_norm.split() for t in tgt_tokens):
                if i > 0:
                    merged = clauses[i - 1].strip() + ", " + cl_clean
                    m_words = merged.split()
                    if 14 <= len(m_words) <= 30:
                        cand = trim_dangling(merged)
                        if cand and len(cand.split()) >= 10:
                            return cand
                if i < len(clauses) - 1:
                    merged = cl_clean + ", " + clauses[i + 1].strip()
                    m_words = merged.split()
                    if 14 <= len(m_words) <= 30:
                        cand = trim_dangling(merged)
                        if cand and len(cand.split()) >= 10:
                            return cand

    # Method B Rule 3: Clean 16-26 word window containing the word
    target_idx = 0
    for idx, w in enumerate(words):
        w_norm = re.sub(r"[^A-Za-z0-9]", "", w.lower())
        if any(tt == w_norm or w_norm.startswith(tt) for tt in tgt_tokens):
            target_idx = idx
            break

    window_size = 22
    start = max(0, target_idx - (window_size // 2))
    end = min(total_w, start + window_size)

    if end - start < 16 and start > 0:
        start = max(0, end - 22)
    if end - start > 26:
        end = start + 24

    window_words = words[start:end]
    window_str = ' '.join(window_words)
    res = trim_dangling(window_str)
    
    if len(res.split()) < 12 and total_w >= 16:
        start = max(0, target_idx - 10)
        end = min(total_w, start + 24)
        res = trim_dangling(' '.join(words[start:end]))

    return res

def generate_contextual_fallback(word_text, pos):
    w = word_text.strip()
    w_cap = w.capitalize()
    if pos == 'v':
        return f"Researchers frequently {w} key evidence to support their scientific theories and investigations."
    elif pos == 'adj':
        return f"The analysis provides a {w} perspective on contemporary environmental and social issues."
    elif pos == 'adv':
        return f"The system operates {w} under rigorous laboratory testing and field evaluation conditions."
    elif pos == 'phr v':
        return f"Scholars frequently {w} new methodologies during comprehensive empirical investigations."
    elif pos == 'phrase':
        return f"The term '{w}' is widely recognized in academic literature and educational discourse."
    else:
        return f"The concept of {w} plays an important role in academic research and analysis."

# ---------------------------------------------------------
# 5. MAIN ENRICHMENT & UPLOAD PIPELINE
# ---------------------------------------------------------
def main():
    print(f"Loading raw dataset from {RAW_CACHE}...", flush=True)
    with open(RAW_CACHE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    passages = raw_data["passages"]
    words = raw_data["words"]
    print(f"Loaded {len(passages)} passages and {len(words)} words.", flush=True)

    passage_map = {p["id"]: p for p in passages}
    test_passages = {}
    for p in passages:
        test_passages.setdefault(p["test_id"], []).append(p["id"])

    # Precompute sentence structures for all 300 passages
    print("\nPrecomputing NLP structures for 300 passages...", flush=True)
    t_pre = time.time()
    passage_structures = {}
    for p in passages:
        content = p.get("content_en") or ""
        sents = nltk.sent_tokenize(content) if content else []
        passage_structures[p["id"]] = [FastSentence(s, i) for i, s in enumerate(sents)]
    print(f"Precomputed {sum(len(v) for v in passage_structures.values())} sentences in {time.time() - t_pre:.2f}s", flush=True)

    print(f"\nProcessing {len(words)} words...", flush=True)
    t_proc = time.time()
    enriched_words = []
    matched_passage_count = 0
    test_fallback_count = 0
    generic_fallback_count = 0

    for i, w in enumerate(words):
        word_text = w["word"]
        meaning = w.get("meaning") or ""
        p_id = w["passage_id"]

        # 1. Example sentence matching
        target_sents = passage_structures.get(p_id, [])
        matched_fs, ctx_tag = match_word_in_passage(word_text, target_sents)

        if matched_fs:
            matched_passage_count += 1
            ex_sentence = format_example_sentence(matched_fs.clean_text, word_text)
        else:
            found_test_fs = None
            cur_p = passage_map.get(p_id)
            if cur_p:
                other_p_ids = [pid for pid in test_passages.get(cur_p["test_id"], []) if pid != p_id]
                for other_pid in other_p_ids:
                    o_fs, o_tag = match_word_in_passage(word_text, passage_structures.get(other_pid, []))
                    if o_fs:
                        found_test_fs = o_fs
                        ctx_tag = o_tag
                        break
            if found_test_fs:
                test_fallback_count += 1
                ex_sentence = format_example_sentence(found_test_fs.clean_text, word_text)
            else:
                generic_fallback_count += 1
                # POS will be determined below, fallback sentence generated after POS
                ex_sentence = None

        # 2. POS determination
        pos = determine_pos(word_text, meaning, contextual_tag=ctx_tag)

        # If generic fallback needed, generate contextual sentence based on POS
        if ex_sentence is None:
            ex_sentence = generate_contextual_fallback(word_text, pos)

        # 3. IPA phonetic conversion
        phonetic = convert_to_ipa(word_text)

        enriched_words.append({
            "id": w["id"],
            "topic_id": w["topic_id"],
            "passage_id": w["passage_id"],
            "word": word_text,
            "meaning": meaning,
            "lesson_name": w.get("lesson_name", ""),
            "lesson_order": w.get("lesson_order", 0),
            "word_order": w.get("word_order", 0),
            "example_sentence": ex_sentence,
            "pos": pos,
            "phonetic": phonetic
        })

        if (i + 1) % 5000 == 0 or (i + 1) == len(words):
            pct = ((i + 1) / len(words)) * 100
            rate = (i + 1) / (time.time() - t_proc)
            print(f"  Processed {i + 1:5d}/{len(words)} words ({pct:5.1f}%) [{rate:5.0f} words/s]", flush=True)

    print("\n--- Enrichment Summary ---", flush=True)
    print(f"Total words:               {len(enriched_words):5d}", flush=True)
    print(f"Matched in target passage: {matched_passage_count:5d} ({matched_passage_count/len(words)*100:.2f}%)", flush=True)
    print(f"Matched in test passages:  {test_fallback_count:5d} ({test_fallback_count/len(words)*100:.2f}%)", flush=True)
    print(f"Generic fallbacks:         {generic_fallback_count:5d} ({generic_fallback_count/len(words)*100:.2f}%)", flush=True)
    print(f"Total coverage:            {len(enriched_words):5d} (100.00%)", flush=True)

    # POS distribution check
    pos_counts = {}
    for ew in enriched_words:
        pos_counts[ew["pos"]] = pos_counts.get(ew["pos"], 0) + 1
    print("\nPOS Distribution:", flush=True)
    for p, c in sorted(pos_counts.items(), key=lambda x: -x[1]):
        print(f"  {p:10s}: {c:5d} ({c/len(words)*100:.2f}%)", flush=True)

    # Quality check: Dangling sentences
    dangling_count = 0
    for ew in enriched_words:
        ex = ew["example_sentence"].rstrip(".?!;: ")
        toks = ex.split()
        if toks and re.sub(r"[^a-zA-Z]", "", toks[-1]).lower() in DANGLING_STOPS:
            dangling_count += 1
    print(f"\nDangling sentences count: {dangling_count} ({dangling_count/len(words)*100:.2f}%)", flush=True)

    # Quality check: Phonetics with unconverted Latin letters
    unconverted_count = 0
    for ew in enriched_words:
        ph = ew["phonetic"].strip("/")
        for t in ew["word"].split():
            clean_t = ''.join(c for c in t.lower() if c.isalpha())
            if not clean_t or clean_t in ('a', 'i'):
                continue
            if clean_t in ph.lower().split():
                unconverted_count += 1
                break
    print(f"Unconverted phonetics count: {unconverted_count} ({unconverted_count/len(words)*100:.2f}%)", flush=True)

    # Save to intermediate cache
    print(f"\nSaving to {ENRICHED_CACHE}...", flush=True)
    with open(ENRICHED_CACHE, "w", encoding="utf-8") as f:
        json.dump(enriched_words, f, ensure_ascii=False)
    print(f"Saved {os.path.getsize(ENRICHED_CACHE) / (1024*1024):.2f} MB", flush=True)

    # Check for --no-upload flag
    if "--no-upload" in sys.argv:
        print("Skipping upload (--no-upload specified).", flush=True)
        return

    # Batch update Supabase
    print("\n--- Uploading to Supabase in batches of 1,000 ---", flush=True)
    batch_size = 1000
    total_words = len(enriched_words)
    total_batches = (total_words + batch_size - 1) // batch_size
    total_updated = 0

    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json"
    }
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/bulk_update_words"

    t_upload = time.time()
    for b in range(total_batches):
        start_idx = b * batch_size
        end_idx = min(total_words, start_idx + batch_size)
        chunk = enriched_words[start_idx:end_idx]

        payload = [
            {
                "id": w["id"],
                "example_sentence": w["example_sentence"],
                "pos": w["pos"],
                "phonetic": w["phonetic"]
            }
            for w in chunk
        ]

        retries = 3
        while retries > 0:
            try:
                resp = requests.post(rpc_url, headers=headers, json={"p_words": payload}, timeout=60)
                if resp.ok:
                    updated = resp.json()
                    total_updated += (updated if isinstance(updated, int) else len(chunk))
                    pct = (end_idx / total_words) * 100
                    print(f"  Batch {b + 1:2d}/{total_batches}: Updated {len(chunk):4d} words ({pct:5.1f}%)", flush=True)
                    break
                else:
                    print(f"  Batch {b + 1} failed (HTTP {resp.status_code}): {resp.text[:200]}", flush=True)
                    retries -= 1
                    time.sleep(2)
            except Exception as e:
                print(f"  Batch {b + 1} exception: {e}", flush=True)
                retries -= 1
                time.sleep(2)
        else:
            raise RuntimeError(f"Failed to upload batch {b + 1} after 3 retries!")

    elapsed_up = time.time() - t_upload
    print(f"\nAll batches uploaded successfully in {elapsed_up:.1f}s! Total updated: {total_updated}", flush=True)

if __name__ == "__main__":
    main()
