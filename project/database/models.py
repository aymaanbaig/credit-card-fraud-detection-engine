from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)  # bcrypt hash


class FlaggedTransaction(Base):
    __tablename__ = "flagged_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, nullable=False)
    user_id = Column(String)
    user_name = Column(String)
    card_last4 = Column(String)
    amount = Column(Float)
    merchant_name = Column(String)
    merchant_category = Column(String)
    decision = Column(String)           # fraud / uncertain / genuine
    risk_score = Column(Float)
    model_used = Column(String)
    triggered_rules = Column(JSON)      # list of rule names
    rule_reasons = Column(JSON)         # list of reason strings
    shap_explanation = Column(JSON)     # list of explanation sentences
    analyst_verdict = Column(String)    # fraud / genuine / unsure — set by analyst
    analyst_note = Column(Text)         # optional free-text note from analyst
    created_at = Column(DateTime, default=datetime.utcnow)
