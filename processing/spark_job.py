def job_sentiment_analyzer_enhanced(spark):
    """
    Job 3 Enhanced: Analyze social media sentiment with NLP
    """
    logger.info("🚀 Starting Enhanced Sentiment Analyzer...")
    
    # Read from Kafka
    df_raw = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "localhost:9092") \
        .option("subscribe", "social-sentiment") \
        .option("startingOffsets", "latest") \
        .load()
    
    # Parse JSON
    df_sentiment = df_raw.select(
        from_json(col("value").cast("string"), sentiment_schema).alias("data")
    ).select("data.*")
    
    # Aggregate sentiment by match with sentiment classification
    df_sentiment_agg = df_sentiment \
        .withWatermark("timestamp", "30 seconds") \
        .groupBy(
            col("match_id"),
            window("timestamp", "1 minute", "30 seconds")
        ) \
        .agg(
            avg("sentiment_score").alias("avg_sentiment"),
            count("*").alias("post_count"),
            max("sentiment_score").alias("max_sentiment"),
            min("sentiment_score").alias("min_sentiment"),
            stddev("sentiment_score").alias("sentiment_volatility")
        ) \
        .withColumn(
            "sentiment_category",
            when(col("avg_sentiment") < -0.6, "very_negative")
            .when(col("avg_sentiment") < -0.2, "negative")
            .when(col("avg_sentiment") < 0.2, "neutral")
            .when(col("avg_sentiment") < 0.6, "positive")
            .otherwise("very_positive")
        )
    
    # Write to console
    query = df_sentiment_agg \
        .select(
            col("window.start"),
            col("match_id"),
            col("avg_sentiment"),
            col("post_count"),
            col("sentiment_category")
        ) \
        .writeStream \
        .outputMode("update") \
        .format("console") \
        .option("truncate", "false") \
        .option("checkpointLocation", "/tmp/spark_sentiment_enhanced_checkpoint") \
        .start()
    
    logger.info("✅ Enhanced Sentiment Analyzer started")
    return query